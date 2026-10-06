/**
 * A chave da OpenRouter, sob qualquer um dos nomes em uso.
 *
 * O chat ficou quebrado em produção porque as rotas leem `OPEN_ROUTER_KEY` e o
 * que está configurado na Vercel é `OPENROUTER_API_KEY`. A rota recebia
 * `undefined` e devolvia 500 "API Key ausente" antes de falar com a OpenRouter;
 * na tela, a resposta ficava num "..." eterno. A chave estava certa e viva — só
 * nunca era lida.
 *
 * Aceitar os dois nomes é deliberado: são os que existem espalhados entre o
 * `.env`, o `.env.example`, a Vercel e a API do Voice, e um nome só resolveria
 * hoje para quebrar de novo no próximo ambiente configurado pelo outro nome.
 * `OPEN_ROUTER_KEY` vem primeiro porque é o que a API do Voice usa.
 *
 * NÃO é `NEXT_PUBLIC_*` de propósito: esta chave fica no servidor. A versão
 * pública existe no `.env` por herança e vai para o navegador, onde qualquer
 * pessoa a extrai.
 */
export function chaveDaOpenRouter(): string | undefined {
  const candidatas = [process.env.OPEN_ROUTER_KEY, process.env.OPENROUTER_API_KEY];
  return candidatas.find((valor) => typeof valor === "string" && valor.trim().length > 0);
}
