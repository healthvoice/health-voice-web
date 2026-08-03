import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

  async rewrites() {
    const target = process.env.API_URL_INTERNAL;
    if (!target) return [];
    return [{ source: "/api-backend/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
