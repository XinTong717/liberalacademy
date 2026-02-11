import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // ✅ 核心修复：使用 beforeFiles 提权
  // 强制在 Next.js 检查系统文件之前进行拦截转发
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/_AMapService/:path*',
          destination: '/api/amap/:path*',
        },
      ]
    }
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