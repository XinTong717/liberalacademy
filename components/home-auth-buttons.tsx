'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function HomeAuthButtons() {
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

  if (authState === 'loading') {
    return null // Don't show anything while loading
  }

  return isAuthenticated ? (
    <Link
      href="/profile"
      className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#4a709a] shadow-md ring-1 ring-[#e7d4b5] transition-colors hover:bg-white sm:px-5 sm:py-2.5 sm:text-sm"
    >
      完善个人信息
    </Link>
  ) : (
    <Link
      href="/login"
      className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#4a709a] shadow-md ring-1 ring-[#e7d4b5] transition-colors hover:bg-white sm:px-5 sm:py-2.5 sm:text-sm"
    >
      注册 / 登录
    </Link>
  )
}
