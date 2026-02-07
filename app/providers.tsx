// app/providers.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST, // e.g. https://us.i.posthog.com
      person_profiles: 'identified_only',
      // Best practice for SPAs / App Router:
      capture_pageview: 'history_change',
      // Optional: newest recommended defaults preset
      // defaults: '2025-11-30',
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}