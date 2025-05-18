"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"; // Import useUser
import { getUserPlanInfoAction } from "@/app/actions/user-actions"
import { UserPlanInfo } from "@/lib/auth/plan"
import { Tier } from "@/lib/stripe/tier-map"

export function usePlan() {
  const { user, isLoaded: isUserLoaded } = useUser(); // Get user and loading state
  const userId = user?.id;

  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null)
  // Start loading true only if user is loaded, otherwise wait
  const [isLoading, setIsLoading] = useState(!isUserLoaded)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Don't fetch if user isn't loaded yet
    if (!isUserLoaded) {
      setIsLoading(true); // Keep loading true until user data is available
      return;
    }

    // If user is loaded but not signed in, set default free plan
    if (!userId) {
      setPlanInfo({ tier: 'starter' });
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true
    async function fetchPlanInfo() {
      // Ensure loading is true at the start of fetch
      if (isMounted) setIsLoading(true);
      setError(null)
      try {
        console.log(`[usePlan] Fetching plan info for userId: ${userId}`);
        const fetchedPlanInfo = await getUserPlanInfoAction() // Calls server action
        if (isMounted) {
          console.log(`[usePlan] Fetched plan info:`, fetchedPlanInfo);
          setPlanInfo(fetchedPlanInfo)
        }
      } catch (err) {
        if (isMounted) {
          console.error("[usePlan] Error fetching user plan info in hook:", err)
          setError(err instanceof Error ? err : new Error("Failed to fetch plan"))
          setPlanInfo({ tier: 'starter' }); // Fallback to starter on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchPlanInfo()

    return () => {
      isMounted = false // Prevent state updates on unmounted component
    }
    // Re-fetch when user loads or userId changes
  }, [userId, isUserLoaded])

  // Return combined loading state (user loading OR plan loading)
  const combinedIsLoading = !isUserLoaded || isLoading;

  // Return the tier directly for convenience, and the full planInfo object
  return {
    tier: planInfo?.tier || (combinedIsLoading ? undefined : 'starter'), // Provide direct tier access, default to starter
    planInfo,
    isLoading: combinedIsLoading,
    error,
  }
} 