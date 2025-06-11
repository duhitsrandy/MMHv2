/*
<ai_context>
This client component identifies the user in PostHog.
</ai_context>
*/

"use client"

import { useUser } from "@clerk/nextjs"
import posthog from "posthog-js"
import { useEffect, useRef } from "react"
import { ANALYTICS_EVENTS } from "@/lib/analytics-events"

export function PostHogUserIdentify() {
  const { user, isLoaded } = useUser()
  const previousUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return;

    const currentUserId = user?.id || null;
    const hadPreviousUser = previousUserId.current !== null;
    const hasCurrentUser = currentUserId !== null;

    if (currentUserId && currentUserId !== previousUserId.current) {
      // User signed in or switched accounts
      posthog.identify(currentUserId, {
        email: user?.emailAddresses?.[0]?.emailAddress,
        first_name: user?.firstName,
        last_name: user?.lastName,
        created_at: user?.createdAt,
      });

      // Track login/signup event
      const isNewUser = user?.createdAt && Date.now() - user.createdAt.getTime() < 60000; // Within last minute
      posthog.capture(isNewUser ? ANALYTICS_EVENTS.USER_SIGNUP : ANALYTICS_EVENTS.USER_LOGIN, {
        user_id: currentUserId,
        signup_method: 'clerk',
        login_method: 'clerk',
      });

    } else if (!currentUserId && hadPreviousUser) {
      // User signed out
      posthog.capture(ANALYTICS_EVENTS.USER_LOGOUT, {
        user_id: previousUserId.current,
      });
      posthog.reset();
    }

    previousUserId.current = currentUserId;
  }, [user?.id, isLoaded, user?.emailAddresses, user?.firstName, user?.lastName, user?.createdAt])

  return null
}
