const LOOPBACK_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Normaliza uma URL usada pelo servidor e impede trafego autenticado em HTTP
 * fora da propria maquina. Somente URLs absolutas sao aceitas: resolver um
 * destino relativo contra o Host recebido permitiria que um cabecalho Host
 * controlado pelo cliente redirecionasse credenciais do servidor.
 */
export function parseSecureServerApiUrl(value: string, label: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} precisa ser uma URL absoluta valida`);
  }

  const host = url.hostname.replace(/^\[(.*)\]$/, "$1").toLowerCase();
  const isHttps = url.protocol === "https:";
  const isLoopbackHttp =
    url.protocol === "http:" && LOOPBACK_HTTP_HOSTS.has(host);

  if (!isHttps && !isLoopbackHttp) {
    throw new Error(
      `${label} precisa usar HTTPS; HTTP e permitido somente em loopback`,
    );
  }

  if (url.username || url.password || url.hash || url.search) {
    throw new Error(`${label} nao pode conter credenciais, query ou fragmento`);
  }

  return url;
}
