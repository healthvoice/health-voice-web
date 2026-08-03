import { getAccessTokenFromCookies } from "@/lib/auth-cookies";

export async function requireApiUser(): Promise<string | null> {
  const token = await getAccessTokenFromCookies();
  const apiUrl = process.env.API_URL_INTERNAL;
  if (!token || !apiUrl) return null;

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/user`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return response.ok ? token : null;
  } catch {
    return null;
  }
}
