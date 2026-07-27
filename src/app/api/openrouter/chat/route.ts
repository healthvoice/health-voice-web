/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import {
  consumePaidAiRateLimit,
  consumePaidAiDailyLimit,
  hasOpenRouterHardBudget,
  InvalidRequestBodyError,
  readJsonWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/paid-ai-guard";
import { validateApiSession } from "@/lib/server-auth";
import { assertSameOriginRequest } from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
// A borda da Vercel rejeita requests acima de 4,5 MB.
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_MESSAGES = 50;
const MAX_TEXT_CHARS = 64 * 1024;
const MAX_MEDIA_PARTS = 4;
const MAX_EMBEDDED_MEDIA_BYTES = 2_500_000;
const MAX_OUTPUT_TOKENS = 2_048;
const MAX_STREAM_BYTES = 256 * 1024;
const PROVIDER_TIMEOUT_MS = 60_000;

const IMAGE_DATA_URL_PATTERN =
  /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]*={0,2})$/;
const PDF_DATA_URL_PATTERN =
  /^data:(application\/pdf);base64,([A-Za-z0-9+/]*={0,2})$/;
const SAFE_FILENAME_PATTERN = /^[^\u0000-\u001f\u007f]{1,255}$/;

function embeddedBytes(base64Payload: string) {
  const padding = base64Payload.endsWith("==")
    ? 2
    : base64Payload.endsWith("=")
      ? 1
      : 0;
  return Math.floor((base64Payload.length * 3) / 4) - padding;
}

function hasValidMessages(
  value: unknown,
): value is Array<Record<string, unknown>> {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_MESSAGES
  ) {
    return false;
  }

  let textChars = 0;
  let mediaParts = 0;
  let embeddedMediaBytes = 0;

  for (const rawMessage of value) {
    if (typeof rawMessage !== "object" || rawMessage === null) return false;

    const message = rawMessage as { role?: unknown; content?: unknown };
    if (
      message.role !== "system" &&
      message.role !== "user" &&
      message.role !== "assistant"
    ) {
      return false;
    }

    if (typeof message.content === "string") {
      textChars += message.content.length;
      continue;
    }

    if (
      message.role !== "user" ||
      !Array.isArray(message.content) ||
      message.content.length === 0
    ) {
      return false;
    }

    for (const rawPart of message.content) {
      if (typeof rawPart !== "object" || rawPart === null) return false;

      const part = rawPart as {
        type?: unknown;
        text?: unknown;
        image_url?: { url?: unknown };
        file?: { filename?: unknown; file_data?: unknown };
      };
      if (part.type === "text" && typeof part.text === "string") {
        textChars += part.text.length;
        continue;
      }

      if (
        part.type === "image_url" &&
        typeof part.image_url?.url === "string"
      ) {
        const match = IMAGE_DATA_URL_PATTERN.exec(part.image_url.url);
        if (!match) return false;

        embeddedMediaBytes += embeddedBytes(match[2]);
        mediaParts += 1;
        continue;
      }

      if (
        part.type === "file" &&
        typeof part.file?.filename === "string" &&
        SAFE_FILENAME_PATTERN.test(part.file.filename) &&
        typeof part.file.file_data === "string"
      ) {
        const match = PDF_DATA_URL_PATTERN.exec(part.file.file_data);
        if (!match) return false;

        embeddedMediaBytes += embeddedBytes(match[2]);
        mediaParts += 1;
        continue;
      }

      return false;
    }
  }

  return (
    textChars <= MAX_TEXT_CHARS &&
    mediaParts <= MAX_MEDIA_PARTS &&
    embeddedMediaBytes <= MAX_EMBEDDED_MEDIA_BYTES
  );
}

function containsPdf(messages: Array<Record<string, unknown>>) {
  return messages.some((message) => {
    if (!Array.isArray(message.content)) return false;
    return message.content.some(
      (part) =>
        typeof part === "object" &&
        part !== null &&
        (part as { type?: unknown }).type === "file",
    );
  });
}

/**
 * Proxy autenticado do OpenRouter. A chave permanece no servidor e nunca
 * entra no bundle entregue ao navegador.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOriginRequest(request);
  } catch {
    return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  }
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return NextResponse.json(
      { error: "Content-Type inválido" },
      { status: 415 },
    );
  }

  const accessToken = await getAccessTokenFromCookies();
  if (!accessToken) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const session = await validateApiSession(request, accessToken);
  if (session.status === "invalid") {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }
  if (session.status === "not_entitled") {
    return NextResponse.json(
      { error: "Assinatura ativa necessária" },
      { status: 403 },
    );
  }
  if (session.status === "misconfigured") {
    return NextResponse.json(
      { error: "API Health não configurada no servidor" },
      { status: 503 },
    );
  }
  if (session.status === "unavailable") {
    return NextResponse.json(
      { error: "Não foi possível validar a sessão" },
      { status: 503 },
    );
  }

  const rateLimit = consumePaidAiRateLimit({
    userId: session.userId,
    route: "openrouter-chat",
    limit: 20,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas solicitações. Tente novamente em instantes." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }
  const dailyLimit = consumePaidAiDailyLimit({
    userId: session.userId,
    route: "openrouter-chat",
    limit: 500,
  });
  if (!dailyLimit.allowed) {
    return NextResponse.json(
      { error: "Limite diÃ¡rio de IA atingido." },
      {
        status: 429,
        headers: { "Retry-After": String(dailyLimit.retryAfterSeconds) },
      },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY não configurada" },
      { status: 503 },
    );
  }
  if (!(await hasOpenRouterHardBudget(apiKey))) {
    return NextResponse.json(
      { error: "Orçamento seguro do provedor de IA indisponível" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await readJsonWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: "Payload excede o limite permitido" },
        { status: 413 },
      );
    }
    if (error instanceof InvalidRequestBodyError) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    throw error;
  }

  const messages =
    typeof body === "object" && body !== null && "messages" in body
      ? (body as { messages?: unknown }).messages
      : undefined;
  if (!hasValidMessages(messages)) {
    return NextResponse.json({ error: "messages inválido" }, { status: 400 });
  }
  const hasPdf = containsPdf(messages);

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Health Voice",
    },
    timeout: PROVIDER_TIMEOUT_MS,
  });

  const providerSignal = AbortSignal.any([
    request.signal,
    AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  ]);
  const completion = await openai.chat.completions.create(
    {
      model: MODEL,
      stream: true,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: messages as any,
      provider: {
        zdr: true,
        data_collection: "deny",
      },
      ...(hasPdf
        ? {
            plugins: [
              {
                id: "file-parser",
                pdf: { engine: "cloudflare-ai" },
              },
            ],
          }
        : {}),
    } as any,
    { signal: providerSignal },
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamedBytes = 0;
      let limitReached = false;
      try {
        for await (const chunk of completion as any) {
          const delta = chunk?.choices?.[0]?.delta?.content;
          if (!delta) continue;

          if (typeof delta === "string") {
            const encoded = encoder.encode(delta);
            streamedBytes += encoded.byteLength;
            if (streamedBytes > MAX_STREAM_BYTES) {
              limitReached = true;
              break;
            }
            controller.enqueue(encoded);
          } else if (Array.isArray(delta)) {
            for (const item of delta) {
              if (typeof item === "string") {
                const encoded = encoder.encode(item);
                streamedBytes += encoded.byteLength;
                if (streamedBytes > MAX_STREAM_BYTES) {
                  limitReached = true;
                  break;
                }
                controller.enqueue(encoded);
              } else if (typeof item?.text === "string") {
                const encoded = encoder.encode(item.text);
                streamedBytes += encoded.byteLength;
                if (streamedBytes > MAX_STREAM_BYTES) {
                  limitReached = true;
                  break;
                }
                controller.enqueue(encoded);
              }
            }
          }
          if (limitReached) break;
        }
      } catch (error: any) {
        if (!request.signal.aborted) {
          console.error("[api/openrouter/chat] Erro no stream:", {
            message: error?.message,
            code: error?.code,
            status: error?.status,
          });
        }
      } finally {
        if (limitReached || request.signal.aborted) {
          (completion as any).controller?.abort();
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
