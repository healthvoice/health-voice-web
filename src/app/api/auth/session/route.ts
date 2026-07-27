import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import { NextResponse } from "next/server";

/**
 * Retorna dados básicos do usuário a partir do accessToken no cookie.
 * Decodifica o payload JWT (sem verificar assinatura — o backend valida).
 */
export async function GET() {
  try {
    const accessToken = await getAccessTokenFromCookies();

    if (!accessToken) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Decodifica o payload do JWT (base64)
    const parts = accessToken.split(".");
    if (parts.length !== 3) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    // Verifica se expirou
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/auth/session] Erro:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
