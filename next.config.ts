import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow external scripts for AMap
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://webapi.amap.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
