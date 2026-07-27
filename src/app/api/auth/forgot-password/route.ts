import { backendFetch, readBackendJson } from "@/lib/api-server";
import {
  isBoundedString,
  isPlainRecord,
  readSameOriginJsonWithLimit,
  requestGuardMessage,
  requestGuardStatus,
} from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await readSameOriginJsonWithLimit(request, MAX_BODY_BYTES);
    if (
      !isPlainRecord(body) ||
      !isBoundedString(body.email, 3, 254) ||
      !EMAIL_PATTERN.test(body.email)
    ) {
      return NextResponse.json(
        { message: "Payload inválido" },
        { status: 400 },
      );
    }

    const response = await backendFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: body.email.trim() }),
      signal: request.signal,
    });
    const data = await readBackendJson(response, 64 * 1024);

    if (!isPlainRecord(data)) {
      return NextResponse.json(
        { message: "Resposta inválida da API" },
        { status: 502 },
      );
    }
    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            typeof data.message === "string"
              ? data.message
              : "Erro ao solicitar recuperação de senha",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(
      {
        message:
          typeof data.message === "string"
            ? data.message
            : "Se o e-mail existir, as instruções serão enviadas.",
      },
      { status: 200 },
    );
  } catch (error) {
    const status = requestGuardStatus(error);
    if (status) {
      return NextResponse.json(
        { message: requestGuardMessage(error) },
        { status },
      );
    }
    console.error("[api/auth/forgot-password] Erro:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
