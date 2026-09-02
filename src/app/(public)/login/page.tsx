import { getHubStatus } from "@/lib/hub-status";
import LoginScreen from "./components/login-screen";

/**
 * Server Component para decidir, antes de renderizar, se esta instalação tem
 * cadastro — o que depende da ponte com o Hub estar ligada, e não de uma
 * variável de build do front.
 *
 * 🔴 `force-dynamic` abaixo é o que faz isso valer. Sem ele o Next prerenderiza
 * a rota como estática e `getHubStatus()` roda no BUILD, congelando no HTML a
 * resposta do ambiente onde o build aconteceu — o mesmo defeito de usar uma
 * `NEXT_PUBLIC_*`, só que disfarçado. O custo é uma ida à API por requisição,
 * mitigado pelo cache de 60s dentro do `getHubStatus`.
 */
export const dynamic = "force-dynamic";

export default async function Login() {
  const { enabled } = await getHubStatus();
  return <LoginScreen hubEnabled={enabled} />;
}
