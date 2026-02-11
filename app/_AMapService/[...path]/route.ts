import { NextRequest } from 'next/server'
import { proxyAmapRequest } from '@/lib/amap-proxy'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ path: string[] }>
}

export async function GET(req: NextRequest, props: RouteContext) {
  const params = await props.params
  return proxyAmapRequest(req, params.path)
}

export async function POST(req: NextRequest, props: RouteContext) {
  const params = await props.params
  return proxyAmapRequest(req, params.path)
}
