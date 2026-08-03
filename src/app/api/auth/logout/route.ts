import { backendFetch } from "@/lib/api-server";
import {
  clearAuthCookies,
  getAccessTokenFromCookies,
} from "@/lib/auth-cookies";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const accessToken = await getAccessTokenFromCookies();
    if (accessToken) {
      await backendFetch("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => undefined);
    }
    await clearAuthCookies();
    return NextResponse.json({ message: "Logout realizado" }, { status: 200 });
  } catch (error) {
    console.error("[api/auth/logout] Erro:", error);
    return NextResponse.json(
      { message: "Erro ao fazer logout" },
      { status: 500 },
    );
  }
}
