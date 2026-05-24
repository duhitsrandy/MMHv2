"use client"

import { useUser } from "@clerk/nextjs"
import * as Sentry from "@sentry/nextjs"
import { useEffect, useRef } from "react"

export function SentryUser() {
  const { user, isLoaded } = useUser()
  const previousUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    const currentUserId = user?.id ?? null

    if (currentUserId && currentUserId !== previousUserId.current) {
      Sentry.setUser({ id: currentUserId })
    } else if (!currentUserId && previousUserId.current) {
      Sentry.setUser(null)
    }

    previousUserId.current = currentUserId
  }, [user?.id, isLoaded])

  return null
}
