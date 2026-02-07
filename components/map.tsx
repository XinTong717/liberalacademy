'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type User = {
  id: string
  name: string
  city: string
  lat: number
  lng: number
}

type MapProps = {
  isLoggedIn: boolean
}

declare global {
  interface Window {
    AMap?: any
    _AMapSecurityConfig?: any
  }
}

function loadAMap(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.AMap) return resolve(window.AMap)

    const existing = document.getElementById('amap-js') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(window.AMap))
      existing.addEventListener('error', () => reject(new Error('AMap script load failed')))
      return
    }

    const script = document.createElement('script')
    script.id = 'amap-js'
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.async = true
    script.onload = () => resolve(window.AMap)
    script.onerror = () => reject(new Error('AMap script load failed'))
    document.head.appendChild(script)
  })
}

function loadGeocoder(AMap: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!AMap) {
      reject(new Error('AMap not ready'))
      return
    }
    if (AMap.Geocoder) {
      resolve(new AMap.Geocoder({ city: '全国' }))
      return
    }
    if (typeof AMap.plugin !== 'function') {
      reject(new Error('AMap plugin API unavailable'))
      return
    }
    AMap.plugin('AMap.Geocoder', () => {
      try {
        if (!AMap.Geocoder) {
          reject(new Error('AMap Geocoder plugin load failed'))
          return
        }
        resolve(new AMap.Geocoder({ city: '全国' }))
      } catch (error) {
        reject(error)
      }
    })
  })
}

export default function Map({ isLoggedIn }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const markerIconRef = useRef<any>(null)
  const amapRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [showLoginHint, setShowLoginHint] = useState(false)

  const usersEmptyMessage = useMemo(() => {
    if (usersLoading) return '正在加载注册用户…'
    if (usersError) return usersError
    if (!users.length) return '暂无注册用户可显示。'
    return null
  }, [usersLoading, usersError, users.length])

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_AMAP_KEY
    const securityJsCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE

    if (!key) {
      setError('缺少 NEXT_PUBLIC_AMAP_KEY（请在 .env.local / Zeabur 环境变量里设置）')
      return
    }
    if (!securityJsCode) {
      setError('缺少 NEXT_PUBLIC_AMAP_SECURITY_CODE（高德 JSAPI v2 新 key 需要安全密钥）')
      return
    }

    window._AMapSecurityConfig = { securityJsCode }

    let cancelled = false

    loadAMap(key)
      .then((AMap) => {
        if (cancelled) return
        if (!AMap) throw new Error('AMap not found on window')
        if (!containerRef.current) throw new Error('Map container not ready')

        amapRef.current = AMap
        const markerIconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
            <defs>
              <linearGradient id="wing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#9ed3d6"/>
                <stop offset="100%" stop-color="#7bb6c8"/>
              </linearGradient>
            </defs>
            <path d="M16 1.5C9.1 1.5 3.6 7 3.6 13.9c0 6.8 8 17.3 12.4 23.4 4.4-6.1 12.4-16.6 12.4-23.4C28.4 7 22.9 1.5 16 1.5z" fill="#fbf7ee" stroke="#6e8fb1" stroke-width="1.4"/>
            <circle cx="16" cy="14" r="6.2" fill="#f6d38c" stroke="#e1b76d" stroke-width="1"/>
            <path d="M8 12.5c3.8-5 8.5-5 16 0" fill="none" stroke="url(#wing)" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `
        markerIconRef.current = new AMap.Icon({
          image: `data:image/svg+xml;utf8,${encodeURIComponent(markerIconSvg)}`,
          size: new AMap.Size(32, 40),
          imageSize: new AMap.Size(32, 40),
        })

        mapRef.current = new AMap.Map(containerRef.current, {
          zoom: 5,
          center: [116.397428, 39.90923],
          viewMode: '3D',
          mapStyle: 'amap://styles/whitesmoke',
        })

        setLoaded(true)
        setError(null)
      })
      .catch((e) => {
        setError(`加载高德地图失败：${String(e?.message ?? e)}`)
      })

    return () => {
      cancelled = true

      if (mapRef.current && markersRef.current.length) {
        markersRef.current.forEach((m) => mapRef.current.remove(m))
      }
      markersRef.current = []

      if (mapRef.current) {
        try {
          mapRef.current.destroy()
        } catch {}
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.setStatus({
      dragEnable: isLoggedIn,
      zoomEnable: isLoggedIn,
      doubleClickZoom: isLoggedIn,
      keyboardEnable: isLoggedIn,
      scrollWheel: isLoggedIn,
      jogEnable: isLoggedIn,
      touchZoom: isLoggedIn,
    })

    if (isLoggedIn) {
      setShowLoginHint(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!loaded || !amapRef.current) return

    let cancelled = false

    const loadUsers = async () => {
      setUsersLoading(true)
      setUsersError(null)
      try {
        const supabase = createClient()
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, country, province, city')
          .not('city', 'is', null)

        if (profilesError) throw profilesError

        const AMap = amapRef.current
        const geocoder = await loadGeocoder(AMap)
        const userLocations = await Promise.all(
          (data ?? []).map(async (profile) => {
            const name = profile.display_name || profile.username || '匿名用户'
            const address = [profile.country, profile.province, profile.city].filter(Boolean).join(' ')
            if (!address) return null
            const cityLimit = profile.city || profile.province || '全国'

            const location = await new Promise<{ lng: number; lat: number } | null>((resolve) => {
              geocoder.getLocation(address, (status: string, result: any) => {
                if (status === 'complete' && result.geocodes?.length) {
                  const { location } = result.geocodes[0]
                  resolve({ lng: location.lng, lat: location.lat })
                  return
                }
                resolve(null)
              }, cityLimit)
            })

            if (!location) return null

            return {
              id: profile.id,
              name,
              city: profile.city ?? '',
              lat: location.lat,
              lng: location.lng,
            }
          })
        )

        if (!cancelled) {
          setUsers(userLocations.filter((u): u is User => Boolean(u)))
        }
      } catch (e: any) {
        if (!cancelled) {
          setUsersError(`加载用户失败：${String(e?.message ?? e)}`)
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      cancelled = true
    }
  }, [loaded, isLoggedIn])

  useEffect(() => {
    const map = mapRef.current
    const AMap = amapRef.current
    const markerIcon = markerIconRef.current

    if (!map || !AMap || !markerIcon) return

    if (markersRef.current.length) {
      markersRef.current.forEach((marker) => map.remove(marker))
      markersRef.current = []
    }

    users.forEach((u) => {
      const marker = new AMap.Marker({
        position: [u.lng, u.lat],
        title: isLoggedIn ? `${u.name} - ${u.city}` : '登录后查看用户信息',
        label: {
          content: isLoggedIn ? `${u.city} · ${u.name}` : '已注册用户',
          direction: 'right',
          offset: new AMap.Pixel(10, -4),
          style: {
            color: isLoggedIn ? '#1a3553' : '#244663',
            border: isLoggedIn ? '1px solid #ddbf92' : '1px solid #c89d68',
            background: isLoggedIn ? 'rgba(255, 252, 245, 0.96)' : 'rgba(255, 251, 240, 0.98)',
            borderRadius: '999px',
            fontSize: '12px',
            padding: '4px 10px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            textShadow: isLoggedIn ? 'none' : '0 1px 0 rgba(255, 255, 255, 0.65)',
            boxShadow: isLoggedIn ? '0 6px 16px rgba(48, 72, 99, 0.18)' : '0 7px 18px rgba(36, 70, 99, 0.22)',
          },
        },
        icon: markerIcon,
        offset: new AMap.Pixel(-16, -36),
      })

      marker.on('click', () => {
        if (!isLoggedIn) {
          setShowLoginHint(true)
          return
        }

        const infoWindow = new AMap.InfoWindow({
          content: `<div style="padding:10px 12px;color:#1a3553;line-height:1.6;font-size:13px;"><strong style="font-size:14px;color:#14304d;">${u.name}</strong><br/>所在地：${u.city}</div>`,
        })
        infoWindow.open(map, [u.lng, u.lat])
      })

      map.add(marker)
      markersRef.current.push(marker)
    })
  }, [users, isLoggedIn])

  return (
    <div className="relative h-screen w-full overflow-hidden border-b border-[#f2e2c9] shadow-[0_20px_60px_-50px_rgba(164,133,94,0.6)]">
      <div ref={containerRef} className="h-full w-full" />

      {!isLoggedIn && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#fdf8ef]/15 backdrop-blur-[0.5px]">
          <Link
            href="/login"
            className="rounded-full bg-[#2f6696] px-10 py-4 text-lg font-semibold text-white shadow-xl transition hover:bg-[#285884]"
          >
            注册/登录后查看其他用户信息
          </Link>
        </div>
      )}

      {(!loaded || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#fdf8f1]">
          <div className="text-center">
            <p className="text-lg text-[#6e8fb1]">加载地图中…</p>
            {error && <p className="mt-2 text-sm text-[#c97c63]">{error}</p>}
          </div>
        </div>
      )}

      {loaded && !error && usersEmptyMessage && !showLoginHint && (
        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-sm text-[#46617a] shadow-md ring-1 ring-[#e7d4b5]">
          {usersEmptyMessage}
        </div>
      )}

      {showLoginHint && !isLoggedIn && (
        <div className="absolute right-4 top-24 z-30 rounded-xl border border-[#e1c59f] bg-[#fff9f1]/95 px-3 py-2 text-xs font-medium text-[#8f5c2f] shadow-lg">
          请先登录后查看详细用户信息
        </div>
      )}
    </div>
  )
}
