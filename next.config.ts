import type { NextConfig } from "next";
import { parseSecureServerApiUrl } from "./src/lib/server-api-url";

const nextConfig: NextConfig = {
  // Evita que lockfiles fora do repositório alterem a raiz inferida do build.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },
  /**
   * Em homologação o navegador chama a mesma origem HTTPS da Vercel e o
   * servidor repassa para a API Health. Isso evita mixed content sem expor
   * segredos no bundle. A regra só existe quando API_URL_INTERNAL é definida.
   */
  async rewrites() {
    const configuredTarget = process.env.API_URL_INTERNAL;
    if (!configuredTarget) return [];
    const target = parseSecureServerApiUrl(configuredTarget, "API_URL_INTERNAL")
      .toString()
      .replace(/\/+$/, "");

    return [
      {
        source: "/api-backend/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/checkout/custom/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
