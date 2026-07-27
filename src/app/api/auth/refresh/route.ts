import { backendFetch, readBackendJson } from "@/lib/api-server";
import {
  clearAuthCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from "@/lib/auth-cookies";
import {
  assertSameOriginRequest,
  isBoundedString,
  isPlainRecord,
  requestGuardMessage,
  requestGuardStatus,
} from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOriginRequest(request);
    const refreshToken = await getRefreshTokenFromCookies();

    if (!refreshToken || refreshToken.length > 16_384) {
      await clearAuthCookies();
      return NextResponse.json(
        { message: "Refresh token não encontrado" },
        { status: 401 },
      );
    }

    const response = await backendFetch("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      signal: request.signal,
    });
    const data = await readBackendJson(response);

    if (!isPlainRecord(data)) {
      await clearAuthCookies();
      return NextResponse.json(
        { message: "Resposta inválida da API" },
        { status: 502 },
      );
    }
    if (!response.ok) {
      await clearAuthCookies();
      return NextResponse.json(
        {
          message:
            typeof data.message === "string" ? data.message : "Sessão expirada",
        },
        { status: 401 },
      );
    }
    if (
      !isBoundedString(data.accessToken, 1, 16_384) ||
      !isBoundedString(data.refreshToken, 1, 16_384)
    ) {
      await clearAuthCookies();
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
    console.error("[api/auth/refresh] Erro:", error);
    await clearAuthCookies();
    return NextResponse.json(
      { message: "Erro ao renovar sessão" },
      { status: 500 },
    );
  }
}
