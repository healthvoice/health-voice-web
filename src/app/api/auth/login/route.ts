import { setAuthCookies } from "@/lib/auth-cookies";
import { backendFetch } from "@/lib/api-server";
import { getHubStatus } from "@/lib/hub-status";
import { NextRequest, NextResponse } from "next/server";

/**
 * Login.
 *
 * A escolha da rota da API acontece AQUI, no servidor, e não no componente: com
 * a ponte ligada, a autenticação é do Hub (`/auth/hub/login`); sem ela, segue o
 * caminho legado. O formulário não muda, não sabe da diferença e não precisa de
 * build por ambiente.
 *
 * Nos dois casos o que volta é o token DESTE produto — o token do Hub não sai
 * da API e nunca chega ao browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled } = await getHubStatus();
    const rota = enabled ? "/auth/hub/login" : "/auth/login";

    const response = await backendFetch(rota, {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // O `code` vem do Hub e distingue os casos que a tela trata de formas
      // diferentes: conta sem acesso ao produto (oferecer plano) e acesso
      // suspenso (mandar regularizar) não são "credenciais inválidas".
      return NextResponse.json(
        {
          message: data.message || "Credenciais inválidas",
          code: data.code,
          profile: data.profile,
        },
        { status: response.status },
      );
    }

    // Seta cookies com os tokens
    await setAuthCookies(data.accessToken, data.refreshToken);

    // Retorna apenas os dados do usuário (tokens ficam nos cookies)
    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (error) {
    console.error("[api/auth/login] Erro:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
