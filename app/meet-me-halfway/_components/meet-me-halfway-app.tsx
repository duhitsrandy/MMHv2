"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { History } from "lucide-react"
import dynamic from "next/dynamic"
import { Location, Search, GeocodedOrigin } from "@/types"
import { useUserData } from "../_hooks/useUserData"
import { useSearchSaver } from "../_hooks/useSearchSaver"
import MeetMeHalfwayForm from "./meet-me-halfway-form"
import SavedLocations from "./saved-locations"
import RecentSearches from "./recent-searches"
import UpgradeModal from "@/components/upgrade-modal"
import { AdBanner } from "@/components/ads/AdBanner"

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
  origins?: GeocodedOrigin[]
}

export default function MeetMeHalfwayApp() {
  const { isLoaded, userId, isSignedIn } = useAuth()
  const [appState, setAppState] = useState<AppState>("input")
  const [appData, setAppData] = useState<AppData>({})
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

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

  // Modal Handlers
  const openUpgradeModal = () => setIsUpgradeModalOpen(true)
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false)
  const handleUpgradeAction = () => {
    console.log("Upgrade action triggered!")
    closeUpgradeModal()
  }

  // Load user data on mount
  useEffect(() => {
    if (userDataError) {
      // Toast is already handled in the hook, maybe just log here
      console.error("User data loading error:", userDataError);
      // Or display a persistent error message in the UI
    }
  }, [userDataError]);

  // Handle form submission
  const handleFindMidpoint = async (data: { origins: GeocodedOrigin[] }) => {
    console.log("[App] handleFindMidpoint called with data:", data);
    if (!data.origins || data.origins.length < 2) {
        console.error("[App] Invalid data received from form:", data);
        // Optionally show a toast error
        return;
    }
    setAppData({ origins: data.origins }); // Set the array of origins
    setAppState("results"); // Switch view

    // --- Save Search Logic (Adaptation Needed) ---
    // For now, let's only save if exactly 2 origins were provided, using the old structure.
    // TODO: Decide how to store multi-origin searches in the DB later (Phase 4 Optional).
    if (data.origins.length === 2) {
        const startOrigin = data.origins[0];
        const endOrigin = data.origins[1];

        // Map back to the structure expected by useSearchSaver
        const newSearchData = {
            startLocationAddress: startOrigin.display_name || "",
            startLocationLat: startOrigin.lat,
            startLocationLng: startOrigin.lng,
            endLocationAddress: endOrigin.display_name || "",
            endLocationLat: endOrigin.lat,
            endLocationLng: endOrigin.lng,
            midpointLat: "0", // Hook still expects these, though maybe not used
            midpointLng: "0"
        };
        await saveSearch(newSearchData); // Call the hook
    } else {
        console.log("[App] Skipping save for multi-origin search (>2 locations).");
    }
    // ----------------------------------------------
  }

  // Handle back to input
  const handleBackToInput = () => {
    setAppData({}); // Clear data when going back
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
                onOpenUpgradeModal={openUpgradeModal}
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

          {appData.origins && appData.origins.length >= 2 ? (
             <ResultsMap
                geocodedOrigins={appData.origins}
             />
           ) : (
             <div className="text-center text-destructive p-4">
               Error: Invalid location data provided for results.
             </div>
           )}
        </div>
      )}

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
        feature="more than 2 locations"
        requiredTier="plus"
      />
    </div>
  )
}
