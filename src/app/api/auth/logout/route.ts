import { clearAuthCookies } from "@/lib/auth-cookies";
import {
  assertSameOriginRequest,
  requestGuardMessage,
  requestGuardStatus,
} from "@/lib/server-request-guard";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOriginRequest(request);
    await clearAuthCookies();
    return NextResponse.json({ message: "Logout realizado" }, { status: 200 });
  } catch (error) {
    const status = requestGuardStatus(error);
    if (status) {
      return NextResponse.json(
        { message: requestGuardMessage(error) },
        { status },
      );
    }
    console.error("[api/auth/logout] Erro:", error);
    return NextResponse.json(
      { message: "Erro ao fazer logout" },
      { status: 500 },
    );
  }
}
