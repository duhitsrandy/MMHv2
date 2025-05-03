"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"; // Import useUser
import { getUserPlanAction } from "../actions/user-actions"
import { UserPlan } from "../types/index"

export function usePlan() {
  const { user, isLoaded: isUserLoaded } = useUser(); // Get user and loading state
  const userId = user?.id;

  const [plan, setPlan] = useState<UserPlan | null>(null)
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
       setPlan('free');
       setIsLoading(false);
       setError(null);
       return;
    }

    let isMounted = true
    async function fetchPlan() {
      // Ensure loading is true at the start of fetch
      if (isMounted) setIsLoading(true);
      setError(null)
      try {
        console.log(`[usePlan] Fetching plan for userId: ${userId}`);
        const fetchedPlan = await getUserPlanAction() // Calls server action
        if (isMounted) {
          console.log(`[usePlan] Fetched plan:`, fetchedPlan);
          setPlan(fetchedPlan)
        }
      } catch (err) {
        if (isMounted) {
          console.error("[usePlan] Error fetching user plan in hook:", err)
          setError(err instanceof Error ? err : new Error("Failed to fetch plan"))
          setPlan(null) // Ensure plan is null on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchPlan()

    return () => {
      isMounted = false // Prevent state updates on unmounted component
    }
    // Re-fetch when user loads or userId changes
  }, [userId, isUserLoaded])

  // Return combined loading state (user loading OR plan loading)
  const combinedIsLoading = !isUserLoaded || isLoading;

  return { plan, isLoading: combinedIsLoading, error }
} 