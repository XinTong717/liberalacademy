'use client'

import { useEffect, useState } from 'react'
import Map from '@/components/map'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'


export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setIsAuthenticated(Boolean(data.session?.user))
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setIsAuthenticated(Boolean(session?.user))
      setAuthReady(true)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fbf7ee]">
      <Map />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fbf7ee]/80 via-[#fdfbf5]/30 to-transparent" />
      <div className="absolute inset-x-4 top-4 z-10 flex flex-col gap-3 sm:inset-x-6 sm:flex-row sm:items-start sm:justify-between">
        {/* Title overlay */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#efdcc4] bg-white/90 px-4 py-3 shadow-lg backdrop-blur sm:gap-4">
          <Image
            src="/brand/liberal-academy-logo.png"
            alt="自由学社标志"
            width={56}
            height={56}
            className="rounded-full border border-[#f0e3cf] bg-white"
            priority
          />
          <div>
            <h1 className="text-xl font-bold leading-tight text-[#46688f] sm:text-2xl">自由学社</h1>
            <p className="text-sm font-medium text-[#5f83ad]">自休学社区地图</p>
          </div>
        </div>

        {/* Navigation overlay */}
        <div className="flex flex-wrap gap-2 sm:justify-end sm:gap-3">
          {!authReady ? null : isAuthenticated ? (
            <Link
              href="/profile"
              className="rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-[#4a709a] shadow-md ring-1 ring-[#e7d4b5] transition-colors hover:bg-white"
            >
              完善个人信息
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-[#4a709a] shadow-md ring-1 ring-[#e7d4b5] transition-colors hover:bg-white"
              >
                注册 / 登录
              </Link>
            </>
          )}
          <Link
            href="/communities"
            className="rounded-full bg-[#e8f3f6]/95 px-5 py-2.5 text-sm font-semibold text-[#3f7d84] shadow-md ring-1 ring-[#b9dfd7] transition-colors hover:bg-[#f0fafb]"
          >
            社群
          </Link>
        </div>
      </div>
    </div>
  )
}
