import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import {
  consumePaidAiRateLimit,
  consumePaidAiDailyLimit,
  hasOpenRouterHardBudget,
  InvalidRequestBodyError,
  InvalidProviderResponseError,
  ProviderResponseTooLargeError,
  readJsonWithLimit,
  readResponseJsonWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/paid-ai-guard";
import { validateApiSession } from "@/lib/server-auth";
import { assertSameOriginRequest } from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 128 * 1024;
const MAX_TITLE_INPUT_CHARS = 16_000;
const MAX_OUTPUT_TOKENS = 128;
const PROVIDER_TIMEOUT_MS = 30_000;

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
      route: "chat-title",
      limit: 30,
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
      route: "chat-title",
      limit: 200,
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

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, MAX_BODY_BYTES);
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
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 20 ||
      messages.some(
        (message) =>
          typeof message !== "object" ||
          message === null ||
          ((message as { role?: unknown }).role !== "user" &&
            (message as { role?: unknown }).role !== "assistant") ||
          typeof (message as { content?: unknown }).content !== "string",
      ) ||
      messages.reduce(
        (total, message) =>
          total + (message as { content: string }).content.length,
        0,
      ) > MAX_TITLE_INPUT_CHARS
    ) {
      return NextResponse.json({ error: "messages inválido" }, { status: 400 });
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

    // Pega apenas as primeiras mensagens para gerar título (economiza tokens)
    const limitedMessages = (
      messages as Array<{
        role: "user" | "assistant";
        content: string;
      }>
    ).slice(0, 4);

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
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente que gera títulos curtos e descritivos para conversas. Gere apenas o título, sem aspas, sem explicações, máximo 5 palavras.",
            },
            {
              role: "user",
              content: `Gere um título curto e descritivo para esta conversa:\n\n${limitedMessages
                .map((message) => `${message.role}: ${message.content}`)
                .join("\n")}`,
            },
          ],
          provider: {
            zdr: true,
            data_collection: "deny",
          },
          max_tokens: MAX_OUTPUT_TOKENS,
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
        { error: "O provedor de IA não conseguiu gerar o título" },
        { status: response.status },
      );
    }

    const data = (await readResponseJsonWithLimit(response, 64 * 1024)) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const title =
      typeof data.choices?.[0]?.message?.content === "string"
        ? data.choices[0].message.content.trim().slice(0, 120)
        : "Nova Conversa";

    return NextResponse.json({ title });
  } catch (error: unknown) {
    console.error("[api/chat/title] Erro:", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return NextResponse.json(
      {
        error:
          error instanceof ProviderResponseTooLargeError ||
          error instanceof InvalidProviderResponseError
            ? "Resposta inválida do provedor de IA"
            : "Erro interno do servidor",
      },
      {
        status:
          error instanceof ProviderResponseTooLargeError ||
          error instanceof InvalidProviderResponseError
            ? 502
            : 500,
      },
    );
  }
}
