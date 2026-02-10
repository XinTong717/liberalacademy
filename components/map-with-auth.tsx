'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const Map = dynamic(() => import('@/components/map'), {
  ssr: false,
})

export default function MapWithAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setIsLoggedIn(!!data.session?.user)
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

  return <Map isLoggedIn={isLoggedIn} />
}
