"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { getLocationsAction } from "@/actions/db/locations-actions"
import { getSearchesAction } from "@/actions/db/searches-actions"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import dynamic from "next/dynamic"
import { Location } from "@/types"
import { Search } from "@/types"
import { toast } from "sonner"
import { createSearchAction } from "@/actions/db/searches-actions"
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
  const [locations, setLocations] = useState<Location[]>([])
  const [searches, setSearches] = useState<Search[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      if (!userId) {
        setLocations([])
        setSearches([])
        return
      }

      setIsLoading(true)
      try {
        const [locationsRes, searchesRes] = await Promise.all([
          getLocationsAction(userId),
          getSearchesAction(userId)
        ])

        if (!locationsRes.isSuccess) {
          console.error("Failed to load locations:", locationsRes.message)
          toast.error("Failed to load saved locations")
        } else {
          setLocations(locationsRes.data || [])
        }

        if (!searchesRes.isSuccess) {
          console.error("Failed to load searches:", searchesRes.message)
          toast.error("Failed to load recent searches")
        } else {
          setSearches(searchesRes.data || [])
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        toast.error("Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded) {
      loadUserData()
    }
  }, [isLoaded, userId])

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
    setAppData(data)
    setAppState("results")

    // Save search history if user is signed in
    console.log(`[App] Checking if user is signed in: ${isSignedIn}, userId: ${userId}`);
    if (isSignedIn && userId) {
      console.log("[App] User is signed in. Attempting to save search...");
      try {
        const newSearchData = {
          userId: userId,
          startLocationAddress: data.startAddress.display_name || "",
          startLocationLat: data.startLat,
          startLocationLng: data.startLng,
          endLocationAddress: data.endAddress.display_name || "",
          endLocationLat: data.endLat,
          endLocationLng: data.endLng,
          // Midpoint will be calculated and potentially saved later
          // For now, we save the search request itself
          midpointLat: "0", 
          midpointLng: "0"
        };
        
        console.log("[App] Calling createSearchAction with:", newSearchData);
        const result = await createSearchAction(newSearchData);
        console.log("[App] createSearchAction result:", result);
        
        if (result.isSuccess && result.data) {
          // Add the new search to the top of the local state
          setSearches(prevSearches => [result.data!, ...prevSearches]);
          toast.success("Search saved to history.");
          console.log("[App] Search saved successfully.");
        } else {
          console.error("Failed to save search:", result.message);
          toast.error("Failed to save search to history.");
          console.error(`[App] Failed to save search: ${result.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error creating search record:", error);
        toast.error("Failed to save search to history due to an unexpected error.");
        console.error("[App] CATCH Error saving search:", error);
      }
    } else {
      console.log("[App] User not signed in or userId missing, skipping search save.");
    }
  }

  // Handle back to input
  const handleBackToInput = () => {
    setAppState("input")
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading...</div>
      </div>
    )
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
