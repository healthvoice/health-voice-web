import { backendFetch, readBackendJson } from "@/lib/api-server";
import {
  isBoundedString,
  isPlainRecord,
  readSameOriginJsonWithLimit,
  requestGuardMessage,
  requestGuardStatus,
} from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: NextRequest) {
  try {
    const body = await readSameOriginJsonWithLimit(request, MAX_BODY_BYTES);
    if (
      !isPlainRecord(body) ||
      !isBoundedString(body.token, 1, 4096) ||
      !isBoundedString(body.newPassword, 8, 512)
    ) {
      return NextResponse.json(
        { message: "Payload inválido" },
        { status: 400 },
      );
    }

    const response = await backendFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: body.token,
        newPassword: body.newPassword,
      }),
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
              : "Erro ao redefinir senha",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(
      {
        message:
          typeof data.message === "string" ? data.message : "Senha redefinida.",
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
    console.error("[api/auth/reset-password] Erro:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
