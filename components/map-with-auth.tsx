'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const Map = dynamic(() => import('@/components/map'), {
  ssr: false,
})

export default function MapWithAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setIsLoggedIn(!!data.session?.user)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setIsLoggedIn(!!session?.user)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fbf7ee]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#46688f] border-t-transparent"></div>
          <p className="text-sm text-[#5f83ad]">加载地图中...</p>
        </div>
      </div>
    )
  }

  return <Map isLoggedIn={isLoggedIn} />
}
