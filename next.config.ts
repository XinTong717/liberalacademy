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
            // 使用数组拼接，物理上杜绝换行符混入
            value: [
              "default-src 'self';",
              // 脚本：允许自己、高德(含子域)、PostHog
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.amap.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com;",
              "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://*.amap.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com;",
              // 连接：允许自己、高德(含子域)、PostHog、MemFire
              "connect-src 'self' https://*.amap.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.memfiredb.com https://*.baseapi.memfiredb.com;", 
              // 图片：允许自己、高德(含子域)
              "img-src 'self' data: blob: https://*.amap.com https://*.is.autonavi.com;",
              // 样式：允许自己、高德
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
