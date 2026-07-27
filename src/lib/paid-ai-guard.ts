import { createHash } from "crypto";

const RATE_LIMIT_WINDOW_MS = 60_000;
const DAILY_LIMIT_WINDOW_MAX_MS = 24 * 60 * 60 * 1_000;
const MAX_BUCKETS = 10_000;
const OPENROUTER_BUDGET_CACHE_MS = 60_000;
const OPENROUTER_BUDGET_FAILURE_CACHE_MS = 10_000;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type PaidAiGlobal = typeof globalThis & {
  __healthPaidAiRateLimits?: Map<string, RateLimitBucket>;
  __healthOpenRouterBudget?: {
    fingerprint: string;
    allowed: boolean;
    expiresAt: number;
  };
};

const paidAiGlobal = globalThis as PaidAiGlobal;
const buckets =
  paidAiGlobal.__healthPaidAiRateLimits ??
  (paidAiGlobal.__healthPaidAiRateLimits = new Map());

export class RequestBodyTooLargeError extends Error {}

export class InvalidRequestBodyError extends Error {}

export class ProviderResponseTooLargeError extends Error {}

export class InvalidProviderResponseError extends Error {}

/**
 * Consome um corpo de request de forma incremental. Conferir apenas
 * Content-Length nao basta, pois requests chunked podem omitir o cabecalho e
 * fazer request.text()/formData() materializar um corpo arbitrariamente grande.
 */
export async function readRequestBytesWithLimit(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLengthHeader = request.headers.get("content-length");
  const declaredLength =
    declaredLengthHeader === null ? Number.NaN : Number(declaredLengthHeader);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await request.body?.cancel().catch(() => undefined);
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("request-size-limit");
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

export async function readJsonWithLimit(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const rawBytes = await readRequestBytesWithLimit(request, maxBytes);
  let rawBody: string;
  try {
    rawBody = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
  } catch {
    throw new InvalidRequestBodyError();
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new InvalidRequestBodyError();
  }
}

/**
 * Le uma resposta remota sem permitir que um provedor envie JSON/texto sem
 * limite para a memoria da Function. O reader e cancelado assim que o teto e
 * ultrapassado.
 */
export async function readResponseTextWithLimit(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new ProviderResponseTooLargeError();
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ProviderResponseTooLargeError();
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export async function readResponseJsonWithLimit(
  response: Response,
  maxBytes: number,
): Promise<unknown> {
  const raw = await readResponseTextWithLimit(response, maxBytes);
  try {
    return JSON.parse(raw);
  } catch {
    throw new InvalidProviderResponseError();
  }
}

/**
 * Encaminha um stream remoto ate o teto configurado. Ao exceder, cancela a
 * origem em vez de continuar baixando e cobrando trabalho sem utilidade.
 */
export function createBoundedProxyStream(
  source: ReadableStream<Uint8Array>,
  maxBytes: number,
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  let total = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        if (!value) return;

        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel("response-size-limit");
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => undefined);
    },
  });
}

export function consumePaidAiRateLimit(params: {
  userId: string;
  route: string;
  limit: number;
}): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const key = `${params.route}:${params.userId}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    cleanupExpiredBuckets(now);
    return { allowed: true };
  }

  if (current.count >= params.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}

export function consumePaidAiDailyLimit(params: {
  userId: string;
  route: string;
  limit: number;
}): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const current = new Date(now);
  const resetAt = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate() + 1,
  );
  const windowMs = Math.min(
    DAILY_LIMIT_WINDOW_MAX_MS,
    Math.max(1, resetAt - now),
  );
  return consumeBucket(
    `daily:${params.route}:${params.userId}`,
    params.limit,
    windowMs,
    now,
  );
}

export function consumePaidAiDailyUsageLimit(params: {
  userId: string;
  route: string;
  amount: number;
  limit: number;
}): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const current = new Date(now);
  const resetAt = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate() + 1,
  );
  const windowMs = Math.min(
    DAILY_LIMIT_WINDOW_MAX_MS,
    Math.max(1, resetAt - now),
  );
  return consumeBucket(
    `daily-usage:${params.route}:${params.userId}`,
    params.limit,
    windowMs,
    now,
    params.amount,
  );
}

function consumeBucket(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
  amount = 1,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { allowed: false, retryAfterSeconds: 1 };
  }
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    if (amount > limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
      };
    }
    buckets.set(key, {
      count: amount,
      resetAt: now + windowMs,
    });
    cleanupExpiredBuckets(now);
    return { allowed: true };
  }

  if (current.count + amount > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += amount;
  return { allowed: true };
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Confirma no próprio OpenRouter que a chave possui um teto de gasto com
 * renovação e saldo disponível. O limiter em memória suaviza abuso por
 * instância; o teto do provedor é a barreira distribuída e autoritativa.
 */
export async function hasOpenRouterHardBudget(
  apiKey: string,
): Promise<boolean> {
  const now = Date.now();
  const fingerprint = createHash("sha256").update(apiKey).digest("hex");
  const cached = paidAiGlobal.__healthOpenRouterBudget;

  if (cached && cached.fingerprint === fingerprint && cached.expiresAt > now) {
    return cached.allowed;
  }

  let allowed = false;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/key", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(3_000),
    });

    if (response.ok) {
      const payload = (await readResponseJsonWithLimit(
        response,
        32 * 1024,
      )) as {
        data?: {
          limit?: unknown;
          limit_remaining?: unknown;
          limit_reset?: unknown;
        };
      };
      const limit = payload.data?.limit;
      const remaining = payload.data?.limit_remaining;
      const reset = payload.data?.limit_reset;

      allowed =
        typeof limit === "number" &&
        Number.isFinite(limit) &&
        limit > 0 &&
        typeof remaining === "number" &&
        Number.isFinite(remaining) &&
        remaining >= 0.5 &&
        (reset === "daily" || reset === "weekly" || reset === "monthly");
    } else {
      await response.body?.cancel().catch(() => undefined);
    }
  } catch {
    allowed = false;
  }

  paidAiGlobal.__healthOpenRouterBudget = {
    fingerprint,
    allowed,
    expiresAt:
      now +
      (allowed
        ? OPENROUTER_BUDGET_CACHE_MS
        : OPENROUTER_BUDGET_FAILURE_CACHE_MS),
  };

  return allowed;
}
