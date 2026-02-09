import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// 定义符合 Next.js 15+ 规范的类型
type RouteContext = {
  params: Promise<{ path: string[] }>
}

// 处理 GET 请求
export async function GET(req: NextRequest, props: RouteContext) {
  // 关键修复：必须 await params
  const params = await props.params
  return handleProxy(req, params.path)
}

// 处理 POST 请求
export async function POST(req: NextRequest, props: RouteContext) {
  // 关键修复：必须 await params
  const params = await props.params
  return handleProxy(req, params.path)
}

// 通用代理逻辑 (保持不变)
async function handleProxy(req: NextRequest, pathParts: string[]) {
  const jscode = process.env.AMAP_SECURITY_JSCODE
  if (!jscode) {
    return NextResponse.json({ error: 'Server: Missing AMAP_SECURITY_JSCODE' }, { status: 500 })
  }

  // 1. 判断上游地址
  const pathStr = pathParts.join('/')
  const isWebAPI = pathStr.startsWith('v4/map/styles')
  const baseUrl = isWebAPI ? 'https://webapi.amap.com' : 'https://restapi.amap.com'
  
  const targetUrl = new URL(`${baseUrl}/${pathStr}`)

  // 2. 复制查询参数
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  // 3. 追加安全密钥
  targetUrl.searchParams.set('jscode', jscode)

  // 4. 发起请求
  try {
    const headers = new Headers(req.headers)
    headers.delete('host')
    
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
    }

    if (req.method === 'POST') {
      fetchOptions.body = await req.text()
    }

    const upstreamRes = await fetch(targetUrl.toString(), fetchOptions)

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: upstreamRes.headers
    })
  } catch (error) {
    console.error('AMap Proxy Error:', error)
    return NextResponse.json({ error: 'Proxy Failed' }, { status: 502 })
  }
}