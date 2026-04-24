import { ACCESS_TOKEN_KEY } from "@/lib/auth-cookies";
import { NextRequest, NextResponse } from "next/server";

// Rotas que não exigem autenticação
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/reset-password",
  "/privacy",
  "/terms",
];

// Prefixos que devem ser ignorados pelo middleware
const IGNORED_PREFIXES = ["/_next", "/api", "/icons", "/logos", "/favicon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignora assets, API routes, e arquivos estáticos
  if (IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Ignora arquivos estáticos (imagens, etc.)
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const isAuthenticated = !!accessToken;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  // Usuário autenticado tentando acessar login/register → redireciona para home
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Usuário não autenticado tentando acessar rota protegida → redireciona para login
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
