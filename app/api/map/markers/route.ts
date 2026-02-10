import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const isOtherCity = (value?: string | null) => value === '其他' || value === '其他城市'
const isOtherProvince = (value?: string | null) => value === '其他地区' || value === '其他'

const resolveDisplayLocation = (
  country?: string | null,
  province?: string | null,
  city?: string | null
) => {
  const trimmedCity = city?.trim() ?? ''
  const trimmedProvince = province?.trim() ?? ''
  const trimmedCountry = country?.trim() ?? ''

  if (trimmedCity) {
    if (!isOtherCity(trimmedCity)) {
      return trimmedCity
    }
    if (trimmedProvince && !isOtherProvince(trimmedProvince)) {
      return trimmedProvince
    }
    return trimmedCountry
  }

  if (trimmedProvince) {
    if (!isOtherProvince(trimmedProvince)) {
      return trimmedProvince
    }
    return trimmedCountry
  }

  return trimmedCountry
}

export async function GET() {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, nickname, country, province, city, lat, lng')
      .not('lat', 'is', null)
      .not('lng', 'is', null)

    if (error) {
      throw error
    }

    const markers = (data ?? [])
      .filter((profile) => profile.lat !== null && profile.lng !== null)
      .map((profile) => ({
        id: profile.id,
        name: profile.display_name || profile.nickname || profile.username || '匿名用户',
        city: resolveDisplayLocation(profile.country, profile.province, profile.city),
        lat: profile.lat as number,
        lng: profile.lng as number,
      }))

    return NextResponse.json(
      { markers },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=90, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Load map markers failed:', error)
    return NextResponse.json({ error: '加载地图标记失败' }, { status: 500 })
  }
}
