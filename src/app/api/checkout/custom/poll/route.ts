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

export async function POST(request: NextRequest) {
  try {
    const body = await readSameOriginJsonWithLimit(request, MAX_BODY_BYTES);
    const pollingToken =
      isPlainRecord(body) && isBoundedString(body.pollingToken, 1, 512)
        ? body.pollingToken.trim()
        : "";
    if (!pollingToken) {
      return NextResponse.json(
        { message: "pollingToken é obrigatório" },
        { status: 400 },
      );
    }

    const response = await backendFetch(
      `/custom-plan/consume/status?pollingToken=${encodeURIComponent(pollingToken)}`,
      { method: "GET", signal: request.signal },
    );
    const data = await readBackendJson(response, 128 * 1024);
    if (!isPlainRecord(data)) {
      return NextResponse.json(
        { message: "Resposta inválida da API" },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (
      response.ok &&
      data.status === "ACTIVE" &&
      isPlainRecord(data.tokens) &&
      isBoundedString(data.tokens.accessToken, 1, 16_384) &&
      isBoundedString(data.tokens.refreshToken, 1, 16_384)
    ) {
      await setAuthCookies(data.tokens.accessToken, data.tokens.refreshToken);
    }

    const safeData = { ...data };
    delete safeData.tokens;
    return NextResponse.json(safeData, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = requestGuardStatus(error);
    if (status) {
      return NextResponse.json(
        { message: requestGuardMessage(error) },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[api/checkout/custom/poll]", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
