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
  // 不同接口在 AMap 的 host 分布并不完全一致。
  // 为避免单一 host 返回 404，这里按路径优先级尝试并在 404 时回退。
  const upstreamHosts = pathStr.startsWith('v4/map/styles')
    ? ['https://webapi.amap.com', 'https://restapi.amap.com']
    : pathStr.startsWith('v3/log/')
      ? ['https://restapi.amap.com', 'https://webapi.amap.com']
      : ['https://restapi.amap.com']

  try {
    // 关键：透传请求头，但删除 host/connection
    const headers = new Headers(req.headers)
    headers.delete('host')
    headers.delete('connection')

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    }

    const requestBody = req.method === 'POST' ? await req.text() : undefined
    if (req.method === 'POST') {
      fetchOptions.body = requestBody
    }

    let upstreamRes: Response | null = null

    for (const host of upstreamHosts) {
      const targetUrl = new URL(`${host}/${pathStr}`)

      req.nextUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value)
      })

      targetUrl.searchParams.set('jscode', jscode)

      const currentResponse = await fetchWithRetry(targetUrl.toString(), fetchOptions)

      // 当首选 host 返回 404 时，尝试下一候选 host。
      if (currentResponse.status === 404 && host !== upstreamHosts[upstreamHosts.length - 1]) {
        continue
      }

      upstreamRes = currentResponse
      break
    }

    if (!upstreamRes) {
      return NextResponse.json({ error: 'Proxy Failed', details: 'No upstream response' }, { status: 502 })
    }
    
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
