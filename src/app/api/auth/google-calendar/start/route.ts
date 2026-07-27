import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Início do OAuth do Google Calendar (integração de agenda — POR USUÁRIO).
 *
 * Monta a URL de consentimento e redireciona. O `state` anti-CSRF vai num
 * cookie httpOnly e é conferido no callback. O client_id NÃO é segredo (vai
 * na URL de qualquer OAuth), mas fica em env para variar por ambiente.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google Calendar não configurado neste ambiente" },
      { status: 503 },
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google-calendar/callback`;
  const state = randomBytes(16).toString("base64url");

  const cookieStore = await cookies();
  cookieStore.set("gcal_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https"),
    maxAge: 600,
    path: "/",
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    // events.readonly = o mínimo p/ ler a agenda; openid email = saber qual
    // conta foi conectada ("conectado como ...")
    "https://www.googleapis.com/auth/calendar.events.readonly openid email",
  );
  // offline + consent: garante refresh_token em TODA conexão
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
