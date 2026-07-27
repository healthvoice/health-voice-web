import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import {
  consumePaidAiDailyLimit,
  consumePaidAiDailyUsageLimit,
  consumePaidAiRateLimit,
  hasOpenRouterHardBudget,
  InvalidProviderResponseError,
  ProviderResponseTooLargeError,
  readRequestBytesWithLimit,
  readResponseJsonWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/paid-ai-guard";
import { assertSameOriginRequest } from "@/lib/server-request-guard";
import { validateApiSession } from "@/lib/server-auth";
import { parseBuffer } from "music-metadata";
import { NextRequest, NextResponse } from "next/server";

const WHISPER_MODEL = "openai/whisper-large-v3";
// A borda da Vercel aceita no maximo 4,5 MB por request.
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const MAX_AUDIO_DURATION_SECONDS = 10 * 60;
const MAX_DAILY_AUDIO_SECONDS = 60 * 60;
const MAX_PROVIDER_RESPONSE_BYTES = 512 * 1024;
const MAX_TRANSCRIPT_BYTES = 256 * 1024;
const PROVIDER_TIMEOUT_MS = 90_000;

const AUDIO_FORMAT_BY_MIME: Record<string, string> = {
  "audio/aac": "aac",
  "audio/flac": "flac",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/x-flac": "flac",
  "audio/x-m4a": "m4a",
  "audio/x-wav": "wav",
  "video/webm": "webm",
};
const AUDIO_FORMAT_BY_EXTENSION: Record<string, string> = {
  aac: "aac",
  flac: "flac",
  m4a: "m4a",
  mp3: "mp3",
  ogg: "ogg",
  wav: "wav",
  webm: "webm",
};

function resolveAudioFormat(file: File): string | null {
  const mime = file.type.split(";", 1)[0].trim().toLowerCase();
  if (AUDIO_FORMAT_BY_MIME[mime]) return AUDIO_FORMAT_BY_MIME[mime];
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_FORMAT_BY_EXTENSION[extension] ?? null;
}

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
      .startsWith("multipart/form-data")
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

  let formData: FormData;
  try {
    const multipartBytes = await readRequestBytesWithLimit(
      request,
      MAX_AUDIO_BYTES + 256 * 1024,
    );
    const multipartBody = new ArrayBuffer(multipartBytes.byteLength);
    new Uint8Array(multipartBody).set(multipartBytes);
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: multipartBody,
    });
    formData = await boundedRequest.formData();
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: "Arquivo excede o limite de 4 MB" },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { error: "Formulário de áudio inválido" },
      { status: 400 },
    );
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file ausente" }, { status: 400 });
  }
  const audioFormat = resolveAudioFormat(file);
  if (file.size === 0 || file.size > MAX_AUDIO_BYTES || !audioFormat) {
    return NextResponse.json(
      { error: "Arquivo de áudio inválido ou maior que 4 MB" },
      { status: file.size > MAX_AUDIO_BYTES ? 413 : 400 },
    );
  }

  let audioBytes: Uint8Array;
  let durationSeconds: number;
  try {
    audioBytes = new Uint8Array(await file.arrayBuffer());
    const mimeType =
      file.type.split(";", 1)[0].trim().toLowerCase() || `audio/${audioFormat}`;
    const metadata = await parseBuffer(
      audioBytes,
      { mimeType, size: file.size },
      { duration: true, skipCovers: true },
    );
    durationSeconds = metadata.format.duration ?? Number.NaN;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível verificar a duração do áudio" },
      { status: 400 },
    );
  }
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    durationSeconds > MAX_AUDIO_DURATION_SECONDS
  ) {
    return NextResponse.json(
      { error: "O áudio deve ter no máximo 10 minutos" },
      { status: 400 },
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

  const rateLimit = consumePaidAiRateLimit({
    userId: session.userId,
    route: "openrouter-transcribe",
    limit: 6,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas transcrições. Tente novamente em instantes." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }
  const dailyLimit = consumePaidAiDailyLimit({
    userId: session.userId,
    route: "openrouter-transcribe",
    limit: 100,
  });
  if (!dailyLimit.allowed) {
    return NextResponse.json(
      { error: "Limite diário de transcrições atingido." },
      {
        status: 429,
        headers: { "Retry-After": String(dailyLimit.retryAfterSeconds) },
      },
    );
  }
  const durationLimit = consumePaidAiDailyUsageLimit({
    userId: session.userId,
    route: "openrouter-transcribe",
    amount: Math.ceil(durationSeconds),
    limit: MAX_DAILY_AUDIO_SECONDS,
  });
  if (!durationLimit.allowed) {
    return NextResponse.json(
      { error: "Limite diário de minutos de áudio atingido." },
      {
        status: 429,
        headers: { "Retry-After": String(durationLimit.retryAfterSeconds) },
      },
    );
  }

  let providerResponse: Response;
  try {
    const audioData = Buffer.from(audioBytes).toString("base64");
    providerResponse = await fetch(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Health Voice",
        },
        body: JSON.stringify({
          model: WHISPER_MODEL,
          input_audio: { data: audioData, format: audioFormat },
          provider: { zdr: true, data_collection: "deny" },
        }),
        signal: AbortSignal.any([
          request.signal,
          AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        ]),
        redirect: "error",
      },
    );
  } catch (error) {
    if (!request.signal.aborted) {
      console.error("[api/openrouter/transcribe] Falha de transporte:", {
        message: error instanceof Error ? error.message : "erro desconhecido",
      });
    }
    return NextResponse.json(
      { error: "O provedor de transcrição está indisponível" },
      { status: 502 },
    );
  }

  if (!providerResponse.ok) {
    await providerResponse.body?.cancel().catch(() => undefined);
    console.error(
      "[api/openrouter/transcribe] Provedor recusou a requisição:",
      {
        status: providerResponse.status,
      },
    );
    return NextResponse.json(
      { error: "O provedor não conseguiu transcrever o áudio" },
      { status: providerResponse.status === 429 ? 503 : 502 },
    );
  }

  let providerBody: { text?: unknown };
  try {
    providerBody = (await readResponseJsonWithLimit(
      providerResponse,
      MAX_PROVIDER_RESPONSE_BYTES,
    )) as { text?: unknown };
  } catch (error) {
    if (
      error instanceof ProviderResponseTooLargeError ||
      error instanceof InvalidProviderResponseError
    ) {
      return NextResponse.json(
        { error: "Resposta inválida do provedor de transcrição" },
        { status: 502 },
      );
    }
    throw error;
  }
  if (
    typeof providerBody.text !== "string" ||
    !providerBody.text.trim() ||
    Buffer.byteLength(providerBody.text, "utf8") > MAX_TRANSCRIPT_BYTES
  ) {
    return NextResponse.json(
      { error: "Resposta inválida do provedor de transcrição" },
      { status: 502 },
    );
  }

  return new Response(providerBody.text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
