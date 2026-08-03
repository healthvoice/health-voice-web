import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/require-api-user";

export async function POST(req: Request) {
  try {
    if (!(await requireApiUser())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { messages } = await req.json();
    const apiKey = process.env.OPEN_ROUTER_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key ausente" }, { status: 500 });
    }

    // Pega apenas as primeiras mensagens para gerar título (economiza tokens)
    const limitedMessages = messages.slice(0, 4);

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
                .map((m: any) => `${m.role}: ${m.content}`)
                .join("\n")}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Erro OpenRouter: ${err}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const title =
      data.choices?.[0]?.message?.content?.trim() || "Nova Conversa";

    return NextResponse.json({ title });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
