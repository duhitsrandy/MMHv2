"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
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
import { usePlan } from "@/hooks/usePlan"

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
type AppData = {
  origins?: GeocodedOrigin[]
}

// Debug component to help diagnose production issues
function DebugInfo({ 
  isLoaded, 
  userId, 
  isSignedIn, 
  locations, 
  searches, 
  isLoading, 
  userDataError,
  planInfo,
  isPlanLoading,
  planError 
}: any) {
  // Only show in development or when explicitly enabled
  const showDebug = process.env.NODE_ENV === 'development' || 
    (typeof window !== 'undefined' && window.location.search.includes('debug=true'));
  
  if (!showDebug) return null;

  return (
    <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <div className="space-y-1">
        <div>Environment: {process.env.NODE_ENV}</div>
        <div>Auth Loaded: {isLoaded ? '✅' : '❌'}</div>
        <div>User ID: {userId || 'null'}</div>
        <div>Is Signed In: {isSignedIn ? '✅' : '❌'}</div>
        <div>Locations Count: {locations?.length || 0}</div>
        <div>Searches Count: {searches?.length || 0}</div>
        <div>User Data Loading: {isLoading ? '⏳' : '✅'}</div>
        <div>User Data Error: {userDataError || 'none'}</div>
        <div>Plan: {planInfo?.tier || 'unknown'}</div>
        <div>Plan Loading: {isPlanLoading ? '⏳' : '✅'}</div>
        <div>Plan Error: {planError?.message || 'none'}</div>
      </div>
    </div>
  );
}

export default function MeetMeHalfwayApp() {
  const { isLoaded, userId, isSignedIn } = useAuth()
  const router = useRouter()
  const [appState, setAppState] = useState<AppState>("input")
  const [appData, setAppData] = useState<AppData>({})
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  // Use the custom hook to manage user data
  const { locations, searches, isLoading, error: userDataError, setSearches } = useUserData(isLoaded ? userId : undefined);
  
  // Get plan information
  const { tier, planInfo, isLoading: isPlanLoading, error: planError } = usePlan();

  // Callback for the search saver hook to update local state
  const handleSearchSaved = useCallback((newSearch: any) => {
    setSearches((prevSearches) => [newSearch, ...prevSearches]);
  }, [setSearches]);

  // Use the search saver hook
  const { saveSearch, saveMultiOriginSearch, isSaving: isSavingSearch, error: searchSaveError } = useSearchSaver({
    userId,
    onSearchSaved: handleSearchSaved
  });

  // Log production issues
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.log('[Production Debug] App state:', {
        isLoaded,
        userId: userId ? 'present' : 'missing',
        isSignedIn,
        locationsCount: locations?.length || 0,
        searchesCount: searches?.length || 0,
        isUserDataLoading: isLoading,
        userDataError: userDataError || 'none',
        plan: tier,
        isPlanLoading,
        planError: planError?.message || 'none'
      });
    }
  }, [isLoaded, userId, isSignedIn, locations, searches, isLoading, userDataError, tier, isPlanLoading, planError]);

  // Modal Handlers
  const openUpgradeModal = () => setIsUpgradeModalOpen(true)
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false)
  const handleUpgradeAction = () => {
    console.log("Upgrade action triggered!")
    closeUpgradeModal()
  }

  // Handle View All Saved Searches button click
  const handleViewAllSavedSearches = () => {
    console.log('[Debug] View All Saved Searches clicked, navigating to /meet-me-halfway/saved-searches');
    router.push('/meet-me-halfway/saved-searches')
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

    // --- Save Search Logic ---
    // Use the new multi-origin search function to support any number of locations
    if (data.origins.length >= 2) {
        const searchData = {
            origins: data.origins.map(origin => ({
                address: origin.display_name || "",
                latitude: origin.lat,
                longitude: origin.lng,
                displayName: origin.display_name
            })),
            searchMetadata: {
                searchType: 'meet-me-halfway',
                locationCount: data.origins.length
            }
        };
        await saveMultiOriginSearch(searchData);
    } else {
        console.log("[App] Not enough origins to save search (need at least 2).");
    }
    // ----------------------------------------------
  }

  // Handle back to input
  const handleBackToInput = () => {
    setAppData({}); // Clear data when going back
    setAppState("input")
  }

  // Show loading state while critical data loads
  console.log('[Debug] Loading check:', { isLoaded, isSignedIn, isLoading, isPlanLoading });
  
  // Only show loading if auth isn't loaded, or if user data is still loading (but not plan loading)
  if (!isLoaded || (isSignedIn && isLoading)) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Meet Me Halfway</h1>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 w-full">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6 lg:space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }



  return (
    <div className="container mx-auto max-w-7xl px-4 py-4 sm:py-8">
      <DebugInfo 
        isLoaded={isLoaded}
        userId={userId}
        isSignedIn={isSignedIn}
        locations={locations}
        searches={searches}
        isLoading={isLoading}
        userDataError={userDataError}
        planInfo={planInfo}
        isPlanLoading={isPlanLoading}
        planError={planError}
      />
      
      {/* Show error state if critical data failed to load */}
      {userDataError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-medium">Error loading user data:</p>
          <p className="text-red-600 text-sm">{userDataError}</p>
        </div>
      )}

      {appState === "input" && (
        <>
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Meet Me Halfway</h1>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={handleViewAllSavedSearches}
              disabled={!isSignedIn}
            >
              <History className="size-4" />
              <span className="truncate">View All Saved Searches</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 w-full">
              <MeetMeHalfwayForm
                initialLocations={locations}
                onFindMidpoint={handleFindMidpoint}
                onOpenUpgradeModal={openUpgradeModal}
              />
            </div>

            <div className="space-y-6 lg:space-y-8">
              <SavedLocations locations={locations} />
              <RecentSearches searches={searches} />
            </div>
          </div>
        </>
      )}

      {appState === "results" && (
        <div className="space-y-4">
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
