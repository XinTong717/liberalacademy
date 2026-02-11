import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_AMapService/')) {
    const rewriteUrl = req.nextUrl.clone()
    rewriteUrl.pathname = pathname.replace('/_AMapService/', '/api/amap/')
    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/_AMapService/:path*'],
}
