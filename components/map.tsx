'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePostHog } from 'posthog-js/react'

type User = {
  id: string
  name: string
  city: string
  lat: number
  lng: number
  gender?: string | null
  age?: number | null
  bio?: string | null
  wechat?: string | null
  parentContact?: boolean
  educatorContact?: boolean
}

type PositionedUser = User & {
  position: [number, number]
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
    if (typeof window === 'undefined') return

    (window as any)._AMapSecurityConfig = {
      serviceHost: `${window.location.origin}/_AMapService`,
    }

    if ((window as any).AMap) {
      resolve((window as any).AMap)
      return
    }

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

const spreadUsers = (userList: User[]): PositionedUser[] => {
  const grouped = new globalThis.Map<string, User[]>()
  const results: PositionedUser[] = []

  userList.forEach((user) => {
    const key = `${user.lat.toFixed(5)}|${user.lng.toFixed(5)}`
    const list = grouped.get(key)
    if (list) {
      list.push(user)
    } else {
      grouped.set(key, [user])
    }
  })

  grouped.forEach((group) => {
    if (group.length === 1) {
      const user = group[0]
      results.push({ ...user, position: [user.lng, user.lat] })
      return
    }

    const primaryRadius = 0.055
    const ringSpacing = 0.038
    const step = (2 * Math.PI) / group.length
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id))

    sorted.forEach((user, index) => {
      const angle = index * step
      const ringIndex = Math.floor(index / 8)
      const radius = primaryRadius + ringIndex * ringSpacing
      const latOffset = radius * Math.sin(angle)
      const lngFactor = Math.cos((user.lat * Math.PI) / 180) || 1
      const lngOffset = (radius * Math.cos(angle)) / lngFactor
      results.push({
        ...user,
        position: [user.lng + lngOffset, user.lat + latOffset],
      })
    })
  })

  return results
}

export default function Map({ isLoggedIn }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const markerIconsRef = useRef<{ default: any; parent: any; educator: any } | null>(null)
  const amapRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [showLoginHint, setShowLoginHint] = useState(false)
  const posthog = usePostHog()

  const usersEmptyMessage = useMemo(() => {
    if (usersLoading) return '正在加载注册用户…'
    if (usersError) return usersError
    if (!users.length) return '暂无注册用户可显示。'
    return null
  }, [usersLoading, usersError, users.length])

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_AMAP_KEY

    if (!key) {
      setError('缺少 NEXT_PUBLIC_AMAP_KEY（请在 .env.local / Zeabur 环境变量里设置）')
      return
    }

    let cancelled = false

    loadAMap(key)
      .then((AMap) => {
        if (cancelled) return
        if (!AMap) throw new Error('AMap not found on window')
        if (!containerRef.current) throw new Error('Map container not ready')

        amapRef.current = AMap
        const createMarkerSvg = ({
          shellStroke,
          centerFill,
          centerStroke,
          wingStart,
          wingEnd,
        }: {
          shellStroke: string
          centerFill: string
          centerStroke: string
          wingStart: string
          wingEnd: string
        }) => `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
            <defs>
              <linearGradient id="wing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="${wingStart}"/>
                <stop offset="100%" stop-color="${wingEnd}"/>
              </linearGradient>
            </defs>
            <path d="M16 1.5C9.1 1.5 3.6 7 3.6 13.9c0 6.8 8 17.3 12.4 23.4 4.4-6.1 12.4-16.6 12.4-23.4C28.4 7 22.9 1.5 16 1.5z" fill="#fbf7ee" stroke="${shellStroke}" stroke-width="1.4"/>
            <circle cx="16" cy="14" r="6.2" fill="${centerFill}" stroke="${centerStroke}" stroke-width="1"/>
            <path d="M8 12.5c3.8-5 8.5-5 16 0" fill="none" stroke="url(#wing)" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `

        const createMarkerIcon = (svg: string) =>
          new AMap.Icon({
            image: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
            size: new AMap.Size(32, 40),
            imageSize: new AMap.Size(32, 40),
          })

        markerIconsRef.current = {
          default: createMarkerIcon(
            createMarkerSvg({
              shellStroke: '#6e8fb1',
              centerFill: '#f6d38c',
              centerStroke: '#e1b76d',
              wingStart: '#9ed3d6',
              wingEnd: '#7bb6c8',
            })
          ),
          parent: createMarkerIcon(
            createMarkerSvg({
              shellStroke: '#a16fbf',
              centerFill: '#f3c9e6',
              centerStroke: '#d895c6',
              wingStart: '#f7b8d9',
              wingEnd: '#d791c8',
            })
          ),
          educator: createMarkerIcon(
            createMarkerSvg({
              shellStroke: '#3f8a95',
              centerFill: '#bdeaf1',
              centerStroke: '#87ccd8',
              wingStart: '#9cd7f2',
              wingEnd: '#72b8d6',
            })
          ),
        }

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
          .select(
            'id, username, display_name, nickname, gender, age, bio, wechat, parent_contact, educator_contact, country, province, city, lat, lng'
          )
          .not('lat', 'is', null)
          .not('lng', 'is', null)

        if (profilesError) throw profilesError

        const userLocations: User[] = (data ?? [])
          .filter((profile) => profile.lat !== null && profile.lng !== null)
          .map((profile) => ({
            id: profile.id,
            name: profile.display_name || profile.username || '匿名用户',
            city: resolveDisplayLocation(profile.country, profile.province, profile.city),
            lat: profile.lat as number,
            lng: profile.lng as number,
            gender: profile.gender ?? null,
            age: profile.age ?? null,
            bio: profile.bio ?? null,
            wechat: profile.wechat ?? null,
            parentContact: Boolean(profile.parent_contact),
            educatorContact: Boolean(profile.educator_contact),
          }))

        if (!cancelled) {
          setUsers(userLocations)
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error(e)
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
    const markerIcons = markerIconsRef.current

    if (!map || !AMap || !markerIcons) return

    if (markersRef.current.length) {
      markersRef.current.forEach((marker) => map.remove(marker))
      markersRef.current = []
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

        const positionedUsers = spreadUsers(users)

        positionedUsers.forEach((u) => {
        const marker = new AMap.Marker({
        position: u.position,
        title: isLoggedIn ? `${u.name} - ${u.city}` : '登录后查看用户信息',
        icon: u.educatorContact
          ? markerIcons.educator
          : u.parentContact
            ? markerIcons.parent
            : markerIcons.default,
        offset: new AMap.Pixel(-16, -36),
      })

      marker.on('click', () => {
        if (!isLoggedIn) {
          posthog?.capture('click_marker_anonymous', { city: u.city })
          setShowLoginHint(true)
          return
        }

        posthog?.capture('view_user_profile_on_map', {
          target_user_name: u.name,
          target_city: u.city,
        })
        
        const wechatValue = u.wechat ? escapeHtml(u.wechat) : ''
        const wechatRow = u.wechat
          ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
              <button id="wechat-reveal-${u.id}" style="border:1px solid #d3b792;background:#fef7eb;color:#8a5a2b;border-radius:999px;padding:2px 10px;font-size:12px;cursor:pointer;">点击显示微信号（添加时请自我介绍）</button>
              <span id="wechat-value-${u.id}" style="display:none;font-weight:600;color:#1a3553;">${wechatValue}</span>
              <button id="wechat-copy-${u.id}" data-wechat="${wechatValue}" disabled style="border:1px solid #c8d7e6;background:#f0f5fb;color:#4b6b89;border-radius:999px;padding:2px 10px;font-size:12px;opacity:0.5;cursor:not-allowed;">复制微信号</button>
            </div>`
          : ''

        const infoRows = [
          `<div><strong style="font-size:14px;color:#14304d;">${escapeHtml(u.name)}</strong></div>`,
          u.gender ? `<div>性别：${escapeHtml(String(u.gender))}</div>` : '',
          u.age ? `<div>年龄：${escapeHtml(String(u.age))}</div>` : '',
          u.city ? `<div>所在地：${escapeHtml(u.city)}</div>` : '',
          u.bio ? `<div>自我介绍：${escapeHtml(u.bio)}</div>` : '',
          wechatRow,
          u.parentContact ? '<div>注册联系人：家长</div>' : '',
          u.educatorContact ? '<div>注册联系人：教育支持者</div>' : '',
        ]
          .filter(Boolean)
          .join('')
          
        const infoWindow = new AMap.InfoWindow({
          content: `<div style="padding:10px 12px;color:#1a3553;line-height:1.6;font-size:13px;">${infoRows}</div>`,
        })
        infoWindow.open(map, u.position)
      
        if (u.wechat) {
          setTimeout(() => {
            const revealButton = document.getElementById(`wechat-reveal-${u.id}`) as HTMLButtonElement | null
            const wechatSpan = document.getElementById(`wechat-value-${u.id}`) as HTMLSpanElement | null
            const copyButton = document.getElementById(`wechat-copy-${u.id}`) as HTMLButtonElement | null

            if (!revealButton || !wechatSpan || !copyButton) return

            const handleReveal = () => {
              wechatSpan.style.display = 'inline'
              copyButton.disabled = false
              copyButton.style.opacity = '1'
              copyButton.style.cursor = 'pointer'
              revealButton.disabled = true
              revealButton.style.opacity = '0.6'
              revealButton.style.cursor = 'not-allowed'
              posthog?.capture('click_reveal_wechat_on_map', {
                target_user_name: u.name,
                target_city: u.city,
              })
            }

            const handleCopy = async () => {
              const wechatText = u.wechat ?? ''
              if (!wechatText) return
              if (!navigator.clipboard?.writeText) {
                copyButton.textContent = '无法复制'
                return
              }
              try {
                await navigator.clipboard.writeText(wechatText)
                copyButton.textContent = '已复制'
                setTimeout(() => {
                  if (copyButton) {
                    copyButton.textContent = '复制微信号'
                  }
                }, 1600)
              } catch {
                copyButton.textContent = '复制失败'
              }
            }

            revealButton.addEventListener('click', handleReveal)
            copyButton.addEventListener('click', handleCopy)
          }, 0)
        }
      })

      map.add(marker)
      markersRef.current.push(marker)
    })
  }, [users, isLoggedIn, posthog])

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
