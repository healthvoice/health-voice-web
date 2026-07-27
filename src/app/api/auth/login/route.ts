import { backendFetch, readBackendJson } from "@/lib/api-server";
import { setAuthCookies } from "@/lib/auth-cookies";
import {
  isBoundedString,
  isPlainRecord,
  readSameOriginJsonWithLimit,
  requestGuardMessage,
  requestGuardStatus,
} from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 2 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await readSameOriginJsonWithLimit(request, MAX_BODY_BYTES);
    if (
      !isPlainRecord(body) ||
      !isBoundedString(body.email, 3, 254) ||
      !EMAIL_PATTERN.test(body.email) ||
      !isBoundedString(body.password, 1, 512)
    ) {
      return NextResponse.json(
        { message: "Payload inválido" },
        { status: 400 },
      );
    }

    const response = await backendFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: body.email.trim(),
        password: body.password,
      }),
      signal: request.signal,
    });
    const data = await readBackendJson(response);

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
              : "Credenciais inválidas",
        },
        { status: response.status },
      );
    }
    if (
      !isBoundedString(data.accessToken, 1, 16_384) ||
      !isBoundedString(data.refreshToken, 1, 16_384)
    ) {
      return NextResponse.json(
        { message: "Resposta inválida da API" },
        { status: 502 },
      );
    }

    await setAuthCookies(data.accessToken, data.refreshToken);
    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (error) {
    const status = requestGuardStatus(error);
    if (status) {
      return NextResponse.json(
        { message: requestGuardMessage(error) },
        { status },
      );
    }
    console.error("[api/auth/login] Erro:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
