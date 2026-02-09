import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { address, city } = await req.json()
    
    // 环境变量：KEY 可以公开，JSCODE 必须保密
    const key = process.env.NEXT_PUBLIC_AMAP_KEY 
    const jscode = process.env.AMAP_SECURITY_JSCODE 

    if (!key || !jscode) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // 组装高德 Web 服务 API
    // ⚠️ 注意：服务端地理编码用的是 restapi.amap.com，不需要 _AMapService 代理，直接调
    const url = new URL('https://restapi.amap.com/v3/geocode/geo')
    url.searchParams.set('key', key)
    url.searchParams.set('address', address)
    if (city) url.searchParams.set('city', city)
    
    // 关键：Web服务API (Server端) 需要把 code 放在 jscode 参数里（如果绑定了的话）
    // 如果你的Key是Web端(JSAPI)，通常Server端调用不需要jscode，
    // 但既然你用的是同一套Key，为了保险，带上或者确认Key类型。
    // *注：通常服务端调用推荐申请一个专门的 "Web服务" 类型的 Key*
    // 但这里为了简化，我们先尝试直接调用。如果失败，你可能需要去高德控制台再申请一个 "Web服务" 类型的Key。

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.status !== '1' || !data.geocodes?.length) {
      return NextResponse.json({ lat: null, lng: null }) // 没查到
    }

    const location = data.geocodes[0].location // 格式 "lng,lat"
    const [lngStr, latStr] = location.split(',')
    
    return NextResponse.json({
      lat: parseFloat(latStr),
      lng: parseFloat(lngStr)
    })

  } catch (error) {
    console.error('Geocode error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}