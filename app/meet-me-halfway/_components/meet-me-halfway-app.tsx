"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { getLocationsAction } from "@/actions/db/locations-actions"
import { getSearchesAction } from "@/actions/db/searches-actions"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import MeetMeHalfwayForm from "./meet-me-halfway-form"
import SavedLocations from "./saved-locations"
import RecentSearches from "./recent-searches"
import dynamic from "next/dynamic"

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
  const { isLoaded, userId } = useAuth()
  const [appState, setAppState] = useState<AppState>("input")
  const [appData, setAppData] = useState<AppData>({})
  const [locations, setLocations] = useState<any[]>([])
  const [searches, setSearches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      if (!userId) {
        setLocations([])
        setSearches([])
        setIsLoading(false)
        return
      }

      try {
        const [locationsRes, searchesRes] = await Promise.all([
          getLocationsAction(userId),
          getSearchesAction(userId)
        ])

        setLocations(locationsRes.data || [])
        setSearches(searchesRes.data || [])
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded) {
      loadUserData()
    }
  }, [isLoaded, userId])

  // Handle form submission
  const handleFindMidpoint = (data: {
    startLat: string
    startLng: string
    startAddress: { lat: number; lng: number; display_name?: string }
    endLat: string
    endLng: string
    endAddress: { lat: number; lng: number; display_name?: string }
  }) => {
    setAppData(data)
    setAppState("results")
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meet Me Halfway</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <History className="size-4" />
          View All Saved Searches
        </Button>
      </div>

      {appState === "input" ? (
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
      ) : (
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
