import { ACCESS_TOKEN_KEY } from "@/lib/auth-cookies";
import { NextRequest, NextResponse } from "next/server";

// Rotas de autenticação (usuários logados são redirecionados para home)
const AUTH_PATHS = ["/login", "/reset-password"];
// Rotas públicas independentemente do estado de autenticação
const PUBLIC_PATHS = ["/privacy", "/terms", "/checkout/custom"];

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

  const matchesPath = (paths: string[]) =>
    paths.some((path) => pathname === path || pathname.startsWith(path + "/"));

  // Congelamento do B2C: qualquer URL antiga de cadastro volta ao login.
  if (pathname === "/register" || pathname.startsWith("/register/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAuthPath = matchesPath(AUTH_PATHS);
  const isPublicPath = matchesPath(PUBLIC_PATHS);

  if (isPublicPath) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const isAuthenticated = !!accessToken;

  // Usuário autenticado tentando acessar login/reset → redireciona para home
  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Usuário não autenticado tentando acessar rota protegida → redireciona para login
  if (!isAuthenticated && !isAuthPath) {
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
