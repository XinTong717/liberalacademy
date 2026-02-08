import type { NextConfig } from "next";

const nextConfig: NextConfig = {  
  output: 'standalone',

  /* config options here */
  // Allow external scripts for AMap
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://webapi.amap.com https://restapi.amap.com https://vdata.amap.com https://us-assets.i.posthog.com; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://webapi.amap.com https://restapi.amap.com https://vdata.amap.com https://us-assets.i.posthog.com; connect-src 'self' https://us.i.posthog.com; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
