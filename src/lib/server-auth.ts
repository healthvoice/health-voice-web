import { NextRequest } from "next/server";
import { readResponseJsonWithLimit } from "./paid-ai-guard";
import { parseSecureServerApiUrl } from "./server-api-url";

export type ApiSessionValidation =
  | { status: "valid"; userId: string }
  | { status: "invalid" }
  | { status: "not_entitled" }
  | { status: "unavailable" }
  | { status: "misconfigured" };

function getApiBaseUrl(): URL | null {
  const configuredUrl =
    process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL;

  if (!configuredUrl) {
    return null;
  }

  try {
    return parseSecureServerApiUrl(configuredUrl, "URL server-side da API");
  } catch {
    return null;
  }
}

/**
 * Confirma o cookie no backend antes de usar serviços pagos server-side.
 *
 * Conferir somente se o cookie existe permitiria que qualquer pessoa criasse
 * um cookie falso e consumisse a cota do OpenRouter. O endpoint `/user` é a
 * fonte de verdade da sessão e também rejeita usuários removidos.
 */
export async function validateApiSession(
  request: NextRequest,
  accessToken: string,
): Promise<ApiSessionValidation> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return { status: "misconfigured" };
  }

  const userUrl = new URL(
    `${apiBaseUrl.pathname.replace(/\/$/, "")}/user`,
    apiBaseUrl,
  );

  try {
    const response = await fetch(userUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
    });

    if (response.status === 401 || response.status === 403) {
      await response.body?.cancel().catch(() => undefined);
      return { status: "invalid" };
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return { status: "unavailable" };
    }

    const user = (await readResponseJsonWithLimit(response, 128 * 1024)) as {
      profile?: { id?: unknown };
    };
    const userId = user.profile?.id;
    if (typeof userId !== "string" || !userId) {
      return { status: "unavailable" };
    }

    const entitlementUrl = new URL(
      `${apiBaseUrl.pathname.replace(/\/$/, "")}/signature/validation`,
      apiBaseUrl,
    );
    const entitlement = await fetch(entitlementUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
    });

    if (entitlement.status === 401) {
      await entitlement.body?.cancel().catch(() => undefined);
      return { status: "invalid" };
    }
    if (entitlement.status === 403) {
      await entitlement.body?.cancel().catch(() => undefined);
      return { status: "not_entitled" };
    }
    if (!entitlement.ok) {
      await entitlement.body?.cancel().catch(() => undefined);
      return { status: "unavailable" };
    }

    await entitlement.body?.cancel().catch(() => undefined);
    return { status: "valid", userId };
  } catch (error) {
    console.error(
      "[server-auth] Não foi possível validar a sessão na API Health:",
      error instanceof Error ? error.message : "erro desconhecido",
    );
    return { status: "unavailable" };
  }
}
