'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { createClient } from '@/lib/supabase/client'

export default function PostHogAuthSync() {
  const posthog = usePostHog()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (user) {
        posthog?.identify(user.id, {
          email: user.email ?? undefined,
        })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        posthog?.identify(session.user.id, {
          email: session.user.email ?? undefined,
        })
      }

      if (event === 'SIGNED_OUT') {
        posthog?.reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [posthog])

  return null
}
