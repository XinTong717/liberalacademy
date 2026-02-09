import type { NextConfig } from "next";

const csp = `
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://webapi.amap.com https://jsapi.amap.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://*.amap.com;
connect-src 'self'
  https://*.amap.com
  https://restapi.amap.com
  https://vdata.amap.com
  https://us.i.posthog.com
  https://*.baseapi.memfiredb.com;
`;

const nextConfig: NextConfig = {  
  output: 'standalone',

  /* config options here */
  // Allow external scripts for AMap
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: 'Content-Security-Policy',
            value:csp.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
