"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { History } from "lucide-react"
import dynamic from "next/dynamic"
import { Location } from "@/types"
import { Search } from "@/types"
import { useUserData } from "../_hooks/useUserData"
import { useSearchSaver } from "../_hooks/useSearchSaver"
import MeetMeHalfwayForm from "./meet-me-halfway-form"
import SavedLocations from "./saved-locations"
import RecentSearches from "./recent-searches"

const ResultsMap = dynamic(
  () => import("./results-map").then((mod) => mod.default),
  {
    loading: () => (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading map...</div>
      </div>
    ),
    ssr: false
  }
)

type AppState = "input" | "results"

interface AppData {
  startLat?: string
  startLng?: string
  startAddress?: { lat: number; lng: number; display_name?: string }
  endLat?: string
  endLng?: string
  endAddress?: { lat: number; lng: number; display_name?: string }
}

export default function MeetMeHalfwayApp() {
  const { isLoaded, userId, isSignedIn } = useAuth()
  const [appState, setAppState] = useState<AppState>("input")
  const [appData, setAppData] = useState<AppData>({})

  // Use the custom hook to manage user data
  const { locations, searches, isLoading, error: userDataError, setSearches } = useUserData(isLoaded ? userId : undefined);

  // Callback for the search saver hook to update local state
  const handleSearchSaved = useCallback((newSearch: Search) => {
    setSearches((prevSearches) => [newSearch, ...prevSearches]);
  }, [setSearches]);

  // Use the search saver hook
  const { saveSearch, isSaving: isSavingSearch, error: searchSaveError } = useSearchSaver({
    userId,
    onSearchSaved: handleSearchSaved
  });

  // Load user data on mount
  useEffect(() => {
    if (userDataError) {
      // Toast is already handled in the hook, maybe just log here
      console.error("User data loading error:", userDataError);
      // Or display a persistent error message in the UI
    }
  }, [userDataError]);

  // Handle form submission
  const handleFindMidpoint = async (data: {
    startLat: string
    startLng: string
    startAddress: { lat: number; lng: number; display_name?: string }
    endLat: string
    endLng: string
    endAddress: { lat: number; lng: number; display_name?: string }
  }) => {
    console.log("[App] handleFindMidpoint called with data:", data);
    setAppData(data); // Set data needed for results view
    setAppState("results"); // Switch view

    // Prepare data for the hook (excluding userId, as the hook adds it)
    const newSearchData = {
      startLocationAddress: data.startAddress.display_name || "",
      startLocationLat: data.startLat,
      startLocationLng: data.startLng,
      endLocationAddress: data.endAddress.display_name || "",
      endLocationLat: data.endLat,
      endLocationLng: data.endLng,
      // Hook expects these fields, even if temporary
      midpointLat: "0", 
      midpointLng: "0" 
    };

    // Call the saveSearch function from the hook (it handles the isSignedIn check)
    await saveSearch(newSearchData); 
    // Note: We don't need to manually update state here, 
    // the onSearchSaved callback handles it.
    // Error handling/toast is also done within the hook.
  }

  // Handle back to input
  const handleBackToInput = () => {
    setAppState("input")
  }

  // Use isLoading from the hook, wait for Clerk to be loaded too
  if (!isLoaded || isLoading) {
    // Show Skeleton UI while loading
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-9 w-64" /> {/* Title Skeleton */}
          <Skeleton className="h-10 w-48" /> {/* Button Skeleton */}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Form Skeletons */}
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-48 mt-4" /> {/* Submit Button Skeleton */}
          </div>

          <div className="space-y-8">
            {/* Saved Locations Skeleton */}
            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
            {/* Recent Searches Skeleton */}
            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {appState === "input" && (
        <>
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Meet Me Halfway</h1>
            <Button variant="outline" className="flex items-center gap-2">
              {/* <History className="size-4" /> */}
              View All Saved Searches
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MeetMeHalfwayForm
                initialLocations={locations}
                onFindMidpoint={handleFindMidpoint}
              />
            </div>

            <div className="space-y-8">
              <SavedLocations locations={locations} />
              <RecentSearches searches={searches} />
            </div>
          </div>
        </>
      )}

      {appState === "results" && (
        <div>
          <Button
            variant="outline"
            className="mb-4"
            onClick={handleBackToInput}
          >
            ← Back to Input
          </Button>

          <ResultsMap
            startLat={appData.startLat || "0"}
            startLng={appData.startLng || "0"}
            endLat={appData.endLat || "0"}
            endLng={appData.endLng || "0"}
            startAddress={appData.startAddress || { lat: 0, lng: 0, display_name: '' }}
            endAddress={appData.endAddress || { lat: 0, lng: 0, display_name: '' }}
          />
        </div>
      )}
    </div>
  )
}
