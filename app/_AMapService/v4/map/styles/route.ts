import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const jscode = process.env.AMAP_SECURITY_JSCODE
  if (!jscode) {
    return new Response('Missing AMAP_SECURITY_JSCODE', { status: 500 })
  }

  const upstream = new URL('https://webapi.amap.com/v4/map/styles')
  req.nextUrl.searchParams.forEach((value, key) => upstream.searchParams.set(key, value))
  upstream.searchParams.set('jscode', jscode)

  const response = await fetch(upstream.toString())
  return new Response(response.body, { status: response.status, headers: response.headers })
}
