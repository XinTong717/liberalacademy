import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

function buildUpstream(req: NextRequest, pathParts: string[]) {
  const jscode = process.env.AMAP_SECURITY_JSCODE
  if (!jscode) {
    throw new Error('Missing AMAP_SECURITY_JSCODE')
  }

  const upstream = new URL(`https://restapi.amap.com/${pathParts.join('/')}`)
  req.nextUrl.searchParams.forEach((value, key) => upstream.searchParams.set(key, value))
  upstream.searchParams.set('jscode', jscode)
  return upstream
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  const upstream = buildUpstream(req, ctx.params.path)
  const response = await fetch(upstream.toString())
  return new Response(response.body, { status: response.status, headers: response.headers })
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  const upstream = buildUpstream(req, ctx.params.path)
  const response = await fetch(upstream.toString(), {
    method: 'POST',
    headers: { 'Content-Type': req.headers.get('content-type') ?? 'application/json' },
    body: await req.text(),
  })
  return new Response(response.body, { status: response.status, headers: response.headers })
}
