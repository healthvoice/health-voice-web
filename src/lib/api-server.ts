import { parseSecureServerApiUrl } from "./server-api-url";
import { readResponseJsonWithLimit } from "./paid-ai-guard";

/**
 * Helper para chamadas server-side à API backend.
 * Usado pelos Route Handlers de auth.
 */
function resolveApiUrl(path: string): string {
  const baseUrl = (
    process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL
  )?.replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error(
      "API_URL_INTERNAL ou NEXT_PUBLIC_API_URL precisa estar configurada",
    );
  }

  const apiUrl = parseSecureServerApiUrl(baseUrl, "URL server-side da API");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiUrl.toString().replace(/\/+$/, "")}${normalizedPath}`;
}

export async function backendFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = resolveApiUrl(path);
  const timeoutSignal = AbortSignal.timeout(15_000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;
  const method = (options.method ?? "GET").toUpperCase();

  return fetch(url, {
    ...options,
    cache: method === "GET" ? "no-store" : options.cache,
    redirect: "error",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function readBackendJson(
  response: Response,
  maxBytes = 256 * 1024,
): Promise<unknown> {
  return readResponseJsonWithLimit(response, maxBytes);
}
