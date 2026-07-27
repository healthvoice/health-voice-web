import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import {
  createBoundedProxyStream,
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

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_MESSAGES = 100;
const MAX_MESSAGE_BYTES = 128 * 1024;
const MAX_MESSAGE_CHARS = 32_000;
const MAX_TOTAL_TEXT_CHARS = 64_000;
const MAX_SYSTEM_PROMPT_CHARS = 12_000;
const MAX_FILES = 4;
const MAX_EMBEDDED_FILE_BYTES = 2_500_000;
const MAX_OUTPUT_TOKENS = 2_048;
const PROVIDER_TIMEOUT_MS = 60_000;
const MAX_STREAM_BYTES = 256 * 1024;
const DATA_URL_PATTERN =
  /^data:(image\/(?:png|jpeg|webp|gif)|application\/pdf);base64,([A-Za-z0-9+/]*={0,2})$/;

type ProviderContentPart =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } }
  | { type: "image_url"; image_url: { url: string } };

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
const ALLOWED_MODELS = new Set([
  DEFAULT_MODEL,
  ...(process.env.OPENROUTER_ALLOWED_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
]);

export async function POST(req: NextRequest) {
  try {
    try {
      assertSameOriginRequest(req);
    } catch {
      return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
    }
    if (
      !req.headers
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

    const session = await validateApiSession(req, accessToken);
    if (session.status === "invalid") {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }
    if (session.status === "not_entitled") {
      return NextResponse.json(
        { error: "Assinatura ativa necessária" },
        { status: 403 },
      );
    }
    if (session.status !== "valid") {
      return NextResponse.json(
        { error: "Não foi possível validar a sessão" },
        { status: 503 },
      );
    }

    const rateLimit = consumePaidAiRateLimit({
      userId: session.userId,
      route: "chat",
      limit: 12,
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
      route: "chat",
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

    let requestBody: unknown;
    try {
      requestBody = await readJsonWithLimit(req, MAX_BODY_BYTES);
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

    if (typeof requestBody !== "object" || requestBody === null) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const { messages, model, files, systemPrompt } = requestBody as {
      messages?: unknown;
      model?: unknown;
      files?: unknown;
      systemPrompt?: unknown;
    };
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > MAX_MESSAGES ||
      Buffer.byteLength(JSON.stringify(messages), "utf8") > MAX_MESSAGE_BYTES ||
      messages.some(
        (message) =>
          typeof message !== "object" ||
          message === null ||
          ((message as { role?: unknown }).role !== "user" &&
            (message as { role?: unknown }).role !== "assistant") ||
          typeof (message as { content?: unknown }).content !== "string" ||
          (message as { content: string }).content.length > MAX_MESSAGE_CHARS,
      ) ||
      messages.reduce(
        (total, message) =>
          total + (message as { content: string }).content.length,
        0,
      ) > MAX_TOTAL_TEXT_CHARS
    ) {
      return NextResponse.json({ error: "messages inválido" }, { status: 400 });
    }
    if (
      systemPrompt !== undefined &&
      (typeof systemPrompt !== "string" ||
        systemPrompt.length > MAX_SYSTEM_PROMPT_CHARS)
    ) {
      return NextResponse.json(
        { error: "systemPrompt inválido" },
        { status: 400 },
      );
    }
    let embeddedFileBytes = 0;
    const invalidFiles =
      files !== undefined &&
      (!Array.isArray(files) ||
        files.length > MAX_FILES ||
        files.some((file) => {
          if (
            typeof file !== "object" ||
            file === null ||
            typeof (file as { base64?: unknown }).base64 !== "string" ||
            typeof (file as { type?: unknown }).type !== "string" ||
            typeof (file as { name?: unknown }).name !== "string" ||
            (file as { name: string }).name.length > 255
          ) {
            return true;
          }

          const typedFile = file as {
            base64: string;
            type: string;
            name: string;
          };
          const match = DATA_URL_PATTERN.exec(typedFile.base64);
          if (!match || match[1] !== typedFile.type) return true;

          const payload = match[2];
          const padding = payload.endsWith("==")
            ? 2
            : payload.endsWith("=")
              ? 1
              : 0;
          embeddedFileBytes += Math.floor((payload.length * 3) / 4) - padding;
          return false;
        }));
    if (invalidFiles || embeddedFileBytes > MAX_EMBEDDED_FILE_BYTES) {
      return NextResponse.json({ error: "files inválido" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key ausente" }, { status: 500 });
    }
    if (!(await hasOpenRouterHardBudget(apiKey))) {
      return NextResponse.json(
        { error: "Orçamento seguro do provedor de IA indisponível" },
        { status: 503 },
      );
    }

    const requestedModel = typeof model === "string" ? model.trim() : "";
    if (requestedModel && !ALLOWED_MODELS.has(requestedModel)) {
      return NextResponse.json(
        { error: "Modelo não permitido" },
        { status: 400 },
      );
    }
    const modelId = requestedModel || DEFAULT_MODEL;

    // DETECÇÃO DE CAPACIDADES
    const isGemini = modelId.includes("gemini");
    const isClaude = modelId.includes("claude");

    // Modelos que suportam IMAGEM nativamente (Vision)
    const supportsVision =
      isGemini ||
      isClaude ||
      modelId.includes("gpt") ||
      modelId.includes("llama") ||
      modelId.includes("vision");

    const now = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long", // segunda-feira
      year: "numeric", // 2025
      month: "long", // dezembro
      day: "numeric", // 09
      hour: "2-digit",
      minute: "2-digit",
    });

    // Monta mensagens de sistema
    const systemMessages: Array<{ role: string; content: string }> = [];

    // Adiciona prompt do sistema se fornecido
    if (systemPrompt && systemPrompt.trim()) {
      systemMessages.push({
        role: "system",
        content: systemPrompt.trim(),
      });
    }

    // Adiciona contexto de data/hora
    const timeContextMessage = {
      role: "system",
      content: `Data e Hora atual (Brasília): ${now}. Use essa data como referência absoluta para responder perguntas sobre "hoje", "ontem", "amanhã" ou prazos.
      SEMPRE RESPONDA EM PORTUGUÊS DO BRASIL!
      `,
    };
    systemMessages.push(timeContextMessage);

    const finalMessages = [...systemMessages, ...messages];
    let hasPdf = false;

    // --- PROCESSAMENTO DE ARQUIVOS ---
    if (files && Array.isArray(files) && files.length > 0) {
      const lastMsgIndex = finalMessages.length - 1;
      const lastMsg = finalMessages[lastMsgIndex];

      const contentArray: ProviderContentPart[] = [
        {
          type: "text",
          text: lastMsg.content || "Analise o contexto enviado.",
        },
      ];
      // Processa cada arquivo
      for (const fileItem of files) {
        const { base64, type, name } = fileItem;

        const isImage = type.startsWith("image");
        const isPdf = type === "application/pdf";

        if (isPdf) {
          hasPdf = true;
          contentArray.push({
            type: "file",
            file: {
              filename: name,
              file_data: base64,
            },
          });
        } else if (isImage && supportsVision) {
          contentArray.push({
            type: "image_url",
            image_url: { url: base64 },
          });
        } else if (isImage) {
          contentArray.push({
            type: "text",
            text: `[Imagem ${name} ignorada: o modelo selecionado não suporta imagens]`,
          });
        } else {
          contentArray.push({
            type: "text",
            text: `[Arquivo ${name} ignorado: formato não suportado]`,
          });
        }
      }

      finalMessages[lastMsgIndex] = {
        role: lastMsg.role,
        content: contentArray,
      };
    }

    // --- CHAMADA FINAL ---
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Health Voice",
        },
        body: JSON.stringify({
          model: modelId,
          messages: finalMessages,
          stream: true,
          max_tokens: MAX_OUTPUT_TOKENS,
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
        }),
        signal: AbortSignal.any([
          req.signal,
          AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        ]),
        redirect: "error",
      },
    );

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return NextResponse.json(
        { error: "O provedor de IA não conseguiu processar a solicitação" },
        { status: response.status },
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "O provedor de IA não retornou um stream" },
        { status: 502 },
      );
    }

    return new Response(
      createBoundedProxyStream(response.body, MAX_STREAM_BYTES),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error: unknown) {
    console.error("[api/chat] Erro:", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
