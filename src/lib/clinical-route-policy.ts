const CLINICAL_CONTENT_ROUTE_PREFIXES = [
  "/dashboard",
  "/recordings",
  "/clients",
  "/agenda",
  "/reminders",
  "/studies",
  "/others",
  "/chat-business",
  "/home4",
  "/ai-test",
  "/ai-components-preview",
  "/3",
] as const;

export function isClinicalContentRoute(pathname: string): boolean {
  if (pathname === "/") return true;

  return CLINICAL_CONTENT_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
