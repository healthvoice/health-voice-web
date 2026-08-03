import { requireApiUser } from "@/lib/require-api-user";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const accessToken = await requireApiUser();
    if (!accessToken) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 },
      );
    }

    const parts = accessToken.split(".");
    if (parts.length !== 3) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 },
      );
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );
    return NextResponse.json({
      authenticated: true,
      user: { id: payload.sub, email: payload.email, role: payload.role },
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 },
    );
  }
}
