import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const apiUrl = process.env.API_URL_INTERNAL;
  if (!apiUrl) {
    return Response.json(
      { message: "API_URL_INTERNAL não configurada" },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const target = new URL(
    `${apiUrl.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}`,
  );
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  for (const name of [
    "host",
    "cookie",
    "content-length",
    "connection",
    "authorization",
  ]) {
    headers.delete(name);
  }

  const accessToken = await getAccessTokenFromCookies();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
    cache: "no-store",
  };
  if (hasBody && request.body) init.duplex = "half";

  const backendResponse = await fetch(target, init);
  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("set-cookie");
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
