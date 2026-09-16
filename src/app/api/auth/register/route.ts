import { setAuthCookies } from "@/lib/auth-cookies";
import { backendFetch } from "@/lib/api-server";
import { getHubStatus } from "@/lib/hub-status";
import { NextRequest, NextResponse } from "next/server";

/**
 * Cadastro.
 *
 * 🔴 Com a ponte ligada, a conta nasce no HUB — nunca só nesta API. Conta criada
 * direto no produto não existe no Hub, não aparece no funil comercial, não tem
 * cobrança e não chega a nenhum outro produto Health. Foi o defeito que o Hub
 * existe para acabar, e o lugar onde ele reapareceria é justamente aqui.
 *
 * Com a ponte desligada, cai no caminho legado — que a própria API recusa
 * enquanto `REGISTRATION_ENABLED` estiver `false`. Ou seja: sem Hub configurado,
 * não há cadastro, e isso é intencional.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled } = await getHubStatus();
    const rota = enabled ? "/auth/hub/register" : "/auth/register";

    const response = await backendFetch(rota, {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        name: body.name,
        mobilePhone: body.mobilePhone,
        registrationPlatform: body.registrationPlatform || "WEB",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // `ACCOUNT_EXISTS` é o erro mais comum do cadastro e merece tratamento
      // próprio na tela ("já tem conta? faça login"), não uma mensagem genérica.
      return NextResponse.json(
        { message: data.message || "Erro ao criar conta", code: data.code },
        { status: response.status },
      );
    }

    // Cadastro concluído NÃO é acesso liberado. Quando o Hub cria a conta sem
    // liberar o produto, não há token clínico para guardar e não há para onde
    // levar a pessoa: a tela precisa dizer que a conta existe e está esperando.
    // Tratar isso como login daria cookie vazio e um app quebrado por dentro.
    if (data.status === "PENDING_ACCESS") {
      return NextResponse.json(
        { status: "PENDING_ACCESS", email: body.email },
        { status: 202 },
      );
    }

    if (!data.accessToken || !data.refreshToken) {
      console.error("[api/auth/register] Resposta sem sessão e sem pendência");
      return NextResponse.json(
        { message: "Não foi possível concluir o cadastro. Tente novamente." },
        { status: 502 },
      );
    }

    await setAuthCookies(data.accessToken, data.refreshToken);

    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch (error) {
    console.error("[api/auth/register] Erro:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
