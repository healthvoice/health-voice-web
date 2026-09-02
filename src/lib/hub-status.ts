import { backendFetch } from "@/lib/api-server";

/**
 * A ponte com o Health Hub está ligada neste ambiente?
 *
 * ─── Por que perguntar à API em vez de ler uma env do front ─────────────────
 *
 * `NEXT_PUBLIC_*` é resolvida em BUILD TIME no Next. Se a decisão morasse numa
 * variável dessas, ligar a ponte exigiria rebuild do front, e — pior — homolog
 * e produção precisariam de builds diferentes. Perguntando à API, o mesmo build
 * serve todos os ambientes e a ponte liga onde a API já está configurada.
 *
 * Só o servidor faz esta chamada; o browser nunca fala com a API direto (padrão
 * BFF do repo). Também é por isso que a chave do Hub jamais chega ao bundle.
 *
 * ─── Sobre o cache ──────────────────────────────────────────────────────────
 *
 * 60s em memória. Sem ele, toda visita ao login somaria uma ida à API antes de
 * qualquer coisa útil acontecer. Com ele, ligar a ponte demora no máximo um
 * minuto para aparecer — que é um preço aceitável por uma configuração que muda
 * raramente.
 */
const CACHE_MS = 60_000;

let cache: { value: HubStatus; expiresAt: number } | null = null;

export interface HubStatus {
  enabled: boolean;
  productCode: string | null;
}

const DESLIGADO: HubStatus = { enabled: false, productCode: null };

export async function getHubStatus(): Promise<HubStatus> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  try {
    const response = await backendFetch("/auth/hub/status", { method: "GET" });
    if (!response.ok) return cacheAndReturn(DESLIGADO);

    const data = (await response.json()) as Partial<HubStatus>;
    return cacheAndReturn({
      enabled: data.enabled === true,
      productCode: data.productCode ?? null,
    });
  } catch (error) {
    // API fora do ar não pode derrubar a tela de login: sem a ponte, o caminho
    // legado ainda funciona. Falhar "desligado" mantém o produto utilizável.
    console.error("[hub-status] não foi possível consultar a API:", error);
    return cacheAndReturn(DESLIGADO);
  }
}

function cacheAndReturn(value: HubStatus): HubStatus {
  cache = { value, expiresAt: Date.now() + CACHE_MS };
  return value;
}

/** Only for tests — zera o cache entre cenários. */
export function resetHubStatusCache(): void {
  cache = null;
}
