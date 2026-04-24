import { backendFetch } from "@/lib/api-server";
import { setAuthCookies } from "@/lib/auth-cookies";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await backendFetch("/custom-plan/consume/card", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data?.tokens?.accessToken && data?.tokens?.refreshToken) {
      await setAuthCookies(data.tokens.accessToken, data.tokens.refreshToken);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[api/checkout/custom/consume-card]", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
