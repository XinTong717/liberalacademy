// app/api/amap/[...path]/route.ts
export const runtime = 'nodejs'

type Ctx = { params: Promise<{ path: string[] }> }

export async function GET(req: Request, { params }: Ctx) {
  const { path } = await params
  return handleProxy(req, path)
}

export async function POST(req: Request, { params }: Ctx) {
  const { path } = await params
  return handleProxy(req, path)
}

async function handleProxy(req: Request, pathParts: string[]) {
  // 你想“走代理隐藏”的机密值：放服务端 env（不要 NEXT_PUBLIC_）
  const jscode = process.env.AMAP_SECURITY_JSCODE
  if (!jscode) {
    return Response.json({ error: 'Missing AMAP_SECURITY_JSCODE' }, { status: 500 })
  }

  // 你要代理到哪个高德域名，按你实际需求改：
  // 常见 Web Service：restapi.amap.com
  const upstreamBase = 'https://restapi.amap.com'
  const upstreamURL = new URL(`${upstreamBase}/${pathParts.join('/')}`)

  // 把原请求 query 透传过去
  const incoming = new URL(req.url)
  incoming.searchParams.forEach((v, k) => upstreamURL.searchParams.set(k, v))

  // 追加你的服务端机密参数（示例：jscode）
  upstreamURL.searchParams.set('jscode', jscode)

  // 透传 body（非 GET/HEAD）
  const method = req.method.toUpperCase()
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await req.arrayBuffer()

  const upstreamRes = await fetch(upstreamURL, {
    method,
    headers: {
      // 最安全：只传必要的，别把 cookie/authorization 之类转发到第三方
      'content-type': req.headers.get('content-type') ?? 'application/json',
    },
    body,
    redirect: 'manual',
  })

  // 组装返回
  const headers = new Headers(upstreamRes.headers)
  // 有时上游会带 content-encoding，直接透传可能导致浏览器解压不匹配（可选防坑）
  headers.delete('content-encoding')

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers,
  })
}
