import { backendFetch } from "@/lib/api-server";
import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Callback do OAuth do Google Calendar.
 *
 * Confere o state anti-CSRF, repassa o `code` para a NOSSA API (que troca
 * pelo refresh_token e o guarda cifrado — o segredo do OAuth vive só lá) e
 * volta para a Agenda com o resultado na query.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const paraAgenda = (resultado: string) =>
    NextResponse.redirect(`${origin}/agenda?google=${resultado}`);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const erro = request.nextUrl.searchParams.get("error");

  const cookieStore = await cookies();
  const stateEsperado = cookieStore.get("gcal_oauth_state")?.value;
  cookieStore.delete("gcal_oauth_state");

  if (erro === "access_denied") return paraAgenda("cancelado");
  if (!code || !state || !stateEsperado || state !== stateEsperado) {
    return paraAgenda("erro");
  }

  const accessToken = await getAccessTokenFromCookies();
  if (!accessToken) return paraAgenda("sem-sessao");

  try {
    // backendFetch usa API_URL_INTERNAL (URL absoluta) — no homolog o
    // NEXT_PUBLIC_API_URL é o rewrite relativo /api-backend, que não serve
    // para fetch server-side.
    const response = await backendFetch("/calendar/google/exchange", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        code,
        redirectUri: `${origin}/api/auth/google-calendar/callback`,
      }),
    });
    if (response.ok) return paraAgenda("ok");
    if (response.status === 403) return paraAgenda("permissao-negada");
    return paraAgenda("erro");
  } catch {
    return paraAgenda("erro");
  }
}
