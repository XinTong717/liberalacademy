import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// 适配 Next.js 15 的参数类型
type RouteContext = {
  params: Promise<{ path: string[] }>
}

export async function GET(req: NextRequest, props: RouteContext) {
  const params = await props.params
  return handleProxy(req, params.path)
}

export async function POST(req: NextRequest, props: RouteContext) {
  const params = await props.params
  return handleProxy(req, params.path)
}

async function handleProxy(req: NextRequest, pathParts: string[]) {
  const jscode = process.env.AMAP_SECURITY_JSCODE
  if (!jscode) {
    return NextResponse.json({ error: 'Server: Missing AMAP_SECURITY_JSCODE' }, { status: 500 })
  }

  const pathStr = pathParts.join('/')
  // 智能识别：V4 接口走 webapi，其他走 restapi
  const isWebAPI = pathStr.startsWith('v4/map/styles')
  const baseUrl = isWebAPI ? 'https://webapi.amap.com' : 'https://restapi.amap.com'
  
  const targetUrl = new URL(`${baseUrl}/${pathStr}`)

  // 1. 复制所有查询参数
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  // 2. 追加安全密钥
  targetUrl.searchParams.set('jscode', jscode)

  try {
    // 3. 关键修复：透传请求头（除了 host）
    // 这样高德就能看到正确的 Referer 和 User-Agent，避免 500 错误
    const headers = new Headers(req.headers)
    headers.delete('host')
    headers.delete('connection')
    
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
      // 禁用自动解压缩，直接透传流（或者让 fetch 解压后再通过 NextResponse 返回）
      // Next.js 的 fetch 默认会解压，所以我们下面删除 content-encoding 头以匹配
    }

    if (req.method === 'POST') {
      fetchOptions.body = await req.text()
    }

    const upstreamRes = await fetch(targetUrl.toString(), fetchOptions)

    // 4. 处理返回头
    const responseHeaders = new Headers(upstreamRes.headers)
    // 删除 content-encoding，防止浏览器因为二次解压而报错
    responseHeaders.delete('content-encoding')
    // 删除 content-length，因为流式传输长度可能会变
    responseHeaders.delete('content-length')

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('AMap Proxy Error:', error)
    return NextResponse.json({ error: 'Proxy Request Failed', details: String(error) }, { status: 502 })
  }
}