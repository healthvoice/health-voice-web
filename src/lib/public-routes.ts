const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/register",
  "/reset-password",
  "/checkout",
] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
