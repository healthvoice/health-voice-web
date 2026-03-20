/**
 * Mapeamento de rotas do App Mobile para Web
 *
 * Este utilitário converte rotas do formato do app mobile (Expo Router)
 * para o formato do web (Next.js App Router)
 */

export type AppRoute = string;
export type WebRoute = string;

/**
 * Mapeamento de rotas do app para web
 */
const ROUTE_MAP: Record<string, (params?: Record<string, any>) => string> = {
  // Home
  "/(tabs)/index": () => "/(home)",

  // Lembretes (Notes/Reminders)
  "/notes/[id]": (params) =>
    `/reminders/${params?.id || "[selected-reminder-id]"}`,
  "/notes": () => "/reminders",

  // Outros (Other)
  "/other/[id]": (params) => `/others/${params?.id || "[selected-other-id]"}`,
  "/other": () => "/others",

  // Estudos (Study)
  "/study/[id]": (params) => `/studies/${params?.id || "[selected-study-id]"}`,
  "/study": () => "/studies",

  // Pacientes/Consultas (Client/Appointment)
  "/patient/[id]": (params) => {
    // No web, pacientes são clientes e consultas são appointments
    // Se tiver appointmentId nos params, usa a rota completa
    if (params?.appointmentId) {
      return `/clients/${params.id}/(selected-appointment)/${params.appointmentId}`;
    }
    // Caso contrário, vai para a página do cliente
    return `/clients/${params?.id || "[selected-client-id]"}`;
  },
  "/patient": () => "/clients",

  // Checkout
  "/(checkout)/checkout": () => {
    // Assumindo que existe uma rota de checkout no web
    // Se não existir, pode redirecionar para home ou criar a rota
    return "/(home)"; // Fallback para home se não houver checkout no web
  },

  // Chat
  "/chat": () => "/chat-business",

  // Notificações
  "/notifications": () => "/notifications",
};

/**
 * Converte uma rota do app mobile para uma rota do web
 *
 * @param appRoute - Rota do app mobile (ex: '/notes/[id]')
 * @param params - Parâmetros para substituir na rota (ex: { id: '123' })
 * @returns Rota do web (ex: '/reminders/123')
 */
export function convertAppRouteToWeb(
  appRoute: AppRoute,
  params?: Record<string, any>,
): WebRoute {
  // Se a rota já está no formato web, retorna como está
  if (
    appRoute.startsWith("/") &&
    !appRoute.includes("(") &&
    !appRoute.includes("[")
  ) {
    // Verifica se é uma rota web válida
    const webRoutes = [
      "/reminders",
      "/others",
      "/studies",
      "/clients",
      "/(home)",
      "/chat-business",
      "/notifications",
    ];

    if (webRoutes.some((route) => appRoute.startsWith(route))) {
      return appRoute;
    }
  }

  // Procura mapeamento exato
  if (ROUTE_MAP[appRoute]) {
    return ROUTE_MAP[appRoute](params);
  }

  // Tenta mapear rotas dinâmicas
  for (const [appPattern, webConverter] of Object.entries(ROUTE_MAP)) {
    // Converte padrão do app para regex
    const appRegex = new RegExp(
      "^" +
        appPattern.replace(/\[([^\]]+)\]/g, "([^/]+)").replace(/\//g, "\\/") +
        "$",
    );

    const match = appRoute.match(appRegex);
    if (match) {
      // Extrai parâmetros da rota
      const paramNames =
        appPattern.match(/\[([^\]]+)\]/g)?.map((p) => p.slice(1, -1)) || [];
      const routeParams: Record<string, any> = { ...params };

      match.slice(1).forEach((value, index) => {
        if (paramNames[index]) {
          routeParams[paramNames[index]] = value;
        }
      });

      return webConverter(routeParams);
    }
  }

  // Fallback: tenta substituir [id] manualmente
  if (appRoute.includes("[id]") && params?.id) {
    const routeWithoutId = appRoute.replace("[id]", params.id);

    // Tenta mapear novamente
    for (const [appPattern, webConverter] of Object.entries(ROUTE_MAP)) {
      if (routeWithoutId === appPattern.replace("[id]", params.id)) {
        return webConverter(params);
      }
    }

    // Mapeamento genérico baseado no prefixo
    if (routeWithoutId.startsWith("/notes/")) {
      return `/reminders/${params.reminderId}`;
    }
    if (routeWithoutId.startsWith("/other/")) {
      return `/others/${params.id}`;
    }
    if (routeWithoutId.startsWith("/study/")) {
      return `/studies/${params.id}`;
    }
    if (routeWithoutId.startsWith("/patient/")) {
      return `/clients/${params.id}`;
    }
  }

  // Se não encontrou mapeamento, retorna rota padrão (home)
  console.warn(
    `[RouteMapper] Rota não mapeada: ${appRoute}, redirecionando para home`,
  );
  return "/(home)";
}

/**
 * Verifica se uma rota é válida no web
 */
export function isValidWebRoute(route: WebRoute): boolean {
  const validRoutes = [
    "/(home)",
    "/reminders",
    "/others",
    "/studies",
    "/clients",
    "/chat-business",
    "/notifications",
    "/recordings",
  ];

  // Verifica se começa com alguma rota válida
  return validRoutes.some((validRoute) => route.startsWith(validRoute));
}
