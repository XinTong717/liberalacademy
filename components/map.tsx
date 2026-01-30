'use client'

import { useEffect, useRef, useState } from 'react'

// Dummy user data - replace with real data from Supabase later
const dummyUsers = [
  { id: 1, name: '张三', city: '北京', lat: 39.9042, lng: 116.4074 },
  { id: 2, name: '李四', city: '上海', lat: 31.2304, lng: 121.4737 },
  { id: 3, name: '王五', city: '广州', lat: 23.1291, lng: 113.2644 },
  { id: 4, name: '赵六', city: '深圳', lat: 22.5431, lng: 114.0579 },
  { id: 5, name: '孙七', city: '杭州', lat: 30.2741, lng: 120.1551 },
  { id: 6, name: '周八', city: '成都', lat: 30.6624, lng: 104.0633 },
]

type User = {
  id: number
  name: string
  city: string
  lat: number
  lng: number
}

interface MapProps {
  users?: User[]
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

export default function Map({ users = dummyUsers }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

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

    // ✅ 官方要求：必须在加载 JSAPI 脚本前设置，否则无效
    // window._AMapSecurityConfig = { securityJsCode: '...' }
    window._AMapSecurityConfig = { securityJsCode } // :contentReference[oaicite:1]{index=1}

    let cancelled = false

    loadAMap(key)
      .then((AMap) => {
        if (cancelled) return
        if (!AMap) throw new Error('AMap not found on window')
        if (!containerRef.current) throw new Error('Map container not ready')

        // 初始化地图（只做最小配置）
        const map = new AMap.Map(containerRef.current, {
          zoom: 5,
          center: [116.397428, 39.90923],
          viewMode: '3D',
        })
        mapRef.current = map

        // 打点
        users.forEach((u) => {
          const marker = new AMap.Marker({
            position: [u.lng, u.lat],
            title: `${u.name} - ${u.city}`,
            label: { content: u.city, direction: 'right' },
          })

          marker.on('click', () => {
            const infoWindow = new AMap.InfoWindow({
              content: `<div style="padding:10px;"><strong>${u.name}</strong><br/>城市: ${u.city}</div>`,
            })
            infoWindow.open(map, [u.lng, u.lat])
          })

          map.add(marker)
          markersRef.current.push(marker)
        })

        setLoaded(true)
        setError(null)
      })
      .catch((e) => {
        setError(`加载高德地图失败：${String(e?.message ?? e)}`)
      })

    return () => {
      cancelled = true

      // 清理 marker
      if (mapRef.current && markersRef.current.length) {
        markersRef.current.forEach((m) => mapRef.current.remove(m))
      }
      markersRef.current = []

      // 清理 map
      if (mapRef.current) {
        // AMap.Map 有 destroy 方法
        try {
          mapRef.current.destroy()
        } catch {}
        mapRef.current = null
      }
    }
  }, [users])

  return (
    <div className="relative w-full h-[500px]">
      <div ref={containerRef} className="w-full h-full" />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-lg text-gray-700">加载地图中…</p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
