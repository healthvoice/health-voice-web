import { backendFetch } from "@/lib/api-server";
import { setAuthCookies } from "@/lib/auth-cookies";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const pollingToken = request.nextUrl.searchParams.get("pollingToken");
    if (!pollingToken) {
      return NextResponse.json(
        { message: "pollingToken é obrigatório" },
        { status: 400 },
      );
    }

    const response = await backendFetch(
      `/custom-plan/consume/status?pollingToken=${encodeURIComponent(pollingToken)}`,
      { method: "GET" },
    );

    const data = await response.json();

    if (
      response.ok &&
      data?.status === "ACTIVE" &&
      data?.tokens?.accessToken &&
      data?.tokens?.refreshToken
    ) {
      await setAuthCookies(data.tokens.accessToken, data.tokens.refreshToken);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[api/checkout/custom/poll]", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
