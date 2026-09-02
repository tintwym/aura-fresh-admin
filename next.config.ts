import type { NextConfig } from "next";

/** Production API on Cloud Run — used on Vercel when API_PROXY_TARGET is unset. */
const PRODUCTION_API =
  "https://shopping-cart-backend-932173135601.asia-southeast1.run.app";

const apiProxyTarget =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  (process.env.VERCEL === "1" ? PRODUCTION_API : "http://127.0.0.1:8080");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
