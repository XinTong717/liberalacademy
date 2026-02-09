import type { NextConfig } from "next";

const nextConfig: NextConfig = {  
  output: 'standalone',

  // 1. 添加重写规则：欺骗高德，把 /_AMapService 转发给 /api/amap
  async rewrites() {
    return [
      {
        source: '/_AMapService/:path*',
        destination: '/api/amap/:path*',
      },
    ]
  },

  // 2. CSP 配置 (保持之前的优化版本)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.amap.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com;",
              "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://*.amap.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com;",
              "connect-src 'self' https://*.amap.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.memfiredb.com https://*.baseapi.memfiredb.com;", 
              "img-src 'self' data: blob: https://*.amap.com https://*.is.autonavi.com;",
              "style-src 'self' 'unsafe-inline' https://*.amap.com;",
              "font-src 'self' data:;",
              "worker-src 'self' blob:;"
            ].join(' ').replace(/\s{2,}/g, ' ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;