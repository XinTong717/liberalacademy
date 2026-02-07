'use client'

import { useEffect, useState } from 'react'
import Map from '@/components/map'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'


export default function Home() {
  const [authState, setAuthState] = useState<'loading' | 'in' | 'out'>('loading')

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setAuthState(data.session?.user ? 'in' : 'out')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setAuthState(session?.user ? 'in' : 'out')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const isAuthenticated = authState === 'in'
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fbf7ee]">
      <Map isLoggedIn={isAuthenticated} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fbf7ee]/80 via-[#fdfbf5]/30 to-transparent" />
      <div className="absolute inset-x-4 top-4 z-10 flex flex-col gap-2 sm:inset-x-6 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        {/* Title overlay */}
        <div className="flex items-center gap-2 rounded-2xl border border-[#efdcc4] bg-white/90 px-3 py-2 shadow-lg backdrop-blur sm:gap-4 sm:px-4 sm:py-3">
          <Image
            src="/brand/liberal-academy-logo.png"
            alt="自由学社标志"
            width={56}
            height={56}
            className="h-10 w-10 rounded-full border border-[#f0e3cf] bg-white sm:h-14 sm:w-14"
            priority
          />
          <div>
            <h1 className="text-lg font-bold leading-tight text-[#46688f] sm:text-2xl">自由学社</h1>
            <p className="text-xs font-medium text-[#5f83ad] sm:text-sm">自休学社区地图</p>
          </div>
        </div>

        {/* Navigation overlay */}
        <div className="flex flex-wrap gap-2 sm:justify-end sm:gap-3">
          {isAuthenticated ? (
            <Link
              href="/profile"
              className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#4a709a] shadow-md ring-1 ring-[#e7d4b5] transition-colors hover:bg-white sm:px-5 sm:py-2.5 sm:text-sm"
            >
              完善个人信息
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#4a709a] shadow-md ring-1 ring-[#e7d4b5] transition-colors hover:bg-white sm:px-5 sm:py-2.5 sm:text-sm"
              >
                注册 / 登录
              </Link>
            </>
          )}
          <Link
            href="/communities"
            className="rounded-full bg-[#e8f3f6]/95 px-4 py-2 text-xs font-semibold text-[#3f7d84] shadow-md ring-1 ring-[#b9dfd7] transition-colors hover:bg-[#f0fafb] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            社群
          </Link>
        </div>
      </div>
    </div>
  )
}
