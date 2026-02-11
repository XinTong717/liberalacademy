import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // ✅ 核心修复：添加路由重写
  async rewrites() {
    return [
      {
        source: '/_AMapService/:path*',
        destination: '/api/amap/:path*', // 将请求暗中转发给合法的 api 路由
      },
    ]
  },

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