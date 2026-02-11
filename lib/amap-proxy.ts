import { NextRequest, NextResponse } from 'next/server'

// 带超时控制的 Fetch
async function fetchWithRetry(url: string, options: RequestInit, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000) // 6秒超时

      const res = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)
      return res
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise((r) => setTimeout(r, 800)) // 失败等待
    }
  }
  throw new Error('All retries failed')
}

export async function proxyAmapRequest(req: NextRequest, pathParts: string[]) {
  const jscode = process.env.AMAP_SECURITY_JSCODE
  if (!jscode) {
    return NextResponse.json({ error: 'Server: Missing AMAP_SECURITY_JSCODE' }, { status: 500 })
  }

  const pathStr = pathParts.join('/')
  // JS SDK 的请求（如 v4/map/styles、v3/log/init）需要走 webapi 域名。
  // 其余（如 geocode 等）继续走 restapi。
  const isWebAPI = pathStr.startsWith('v4/map/styles') || pathStr.startsWith('v3/log/')
  const baseUrl = isWebAPI ? 'https://webapi.amap.com' : 'https://restapi.amap.com'

  const targetUrl = new URL(`${baseUrl}/${pathStr}`)

  // 复制 Query
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  // 追加密钥
  targetUrl.searchParams.set('jscode', jscode)

  try {
    // 关键：透传请求头，但删除 host/connection
    const headers = new Headers(req.headers)
    headers.delete('host')
    headers.delete('connection')

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    }

    if (req.method === 'POST') {
      fetchOptions.body = await req.text()
    }

    const upstreamRes = await fetchWithRetry(targetUrl.toString(), fetchOptions)

    // 清理返回头
    const responseHeaders = new Headers(upstreamRes.headers)
    responseHeaders.delete('content-encoding')
    responseHeaders.delete('content-length')

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('AMap Proxy Error:', error)
    return NextResponse.json({ error: 'Proxy Failed', details: String(error) }, { status: 502 })
  }
}
