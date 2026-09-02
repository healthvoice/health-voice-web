import { redirect } from "next/navigation";
import { getHubStatus } from "@/lib/hub-status";
import RegisterScreen from "./components/register-screen";

/**
 * Cadastro — de volta em 02/09/2026, quando a Health voltou a ser SaaS.
 *
 * Esta página foi reduzida a um `redirect("/login")` em 03/08/2026, no
 * congelamento do B2C (commit `6301d94`). O congelamento acabou, mas o redirect
 * NÃO foi simplesmente revertido: ele agora é condicional.
 *
 * A condição é a ponte com o Hub estar ligada, e não uma flag própria do front.
 * O motivo é que a conta precisa nascer no Hub — cadastro que caísse no caminho
 * legado criaria conta só nesta API, invisível para o funil comercial e para a
 * cobrança. Sem Hub configurado, portanto, é melhor não ter tela de cadastro do
 * que ter uma que produz conta órfã.
 *
 * Server Component de propósito: a decisão é tomada antes de qualquer HTML ir
 * para o browser, então não existe o piscar de uma tela que some.
 *
 * 🔴 `force-dynamic` abaixo é o que faz tudo isso valer. Sem ele o Next
 * prerenderiza a rota como estática e `getHubStatus()` roda no BUILD,
 * congelando no HTML a resposta do ambiente onde o build aconteceu — o mesmo
 * defeito de usar uma `NEXT_PUBLIC_*`, só que disfarçado. O custo é uma ida à
 * API por requisição, mitigado pelo cache de 60s dentro do `getHubStatus`.
 */
export const dynamic = "force-dynamic";

export default async function Register() {
  const { enabled } = await getHubStatus();
  if (!enabled) redirect("/login");

  return <RegisterScreen />;
}
