/**
 * Helper para chamadas server-side à API backend.
 * Usado pelos Route Handlers de auth.
 */

const API_URL = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL;

export async function backendFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_URL}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
