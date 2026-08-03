import { cookies } from "next/headers";

const ACCESS_TOKEN_KEY = "hv_access_token";
const REFRESH_TOKEN_KEY = "hv_refresh_token";

// Mesma validade do accessToken JWT na API: 1 hora.
const ACCESS_TOKEN_MAX_AGE = 60 * 60;
// Mesma validade do refreshToken JWT na API: 30 dias.
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

const isProduction = process.env.NODE_ENV === "production";

/**
 * Seta ambos os cookies de autenticação na response.
 * - accessToken: cookie regular (acessível por JS para o header Authorization)
 * - refreshToken: cookie httpOnly (protegido contra XSS)
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
) {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_KEY, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  cookieStore.set(REFRESH_TOKEN_KEY, refreshToken, {
    httpOnly: true, // Protegido — só acessível pelo server
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Lê o refreshToken do cookie httpOnly (server-side only).
 */
export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_KEY)?.value ?? null;
}

/**
 * Lê o accessToken do cookie (server-side).
 */
export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_KEY)?.value ?? null;
}

/**
 * Limpa ambos os cookies de autenticação.
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_KEY, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set(REFRESH_TOKEN_KEY, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
