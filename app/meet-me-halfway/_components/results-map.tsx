"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import {
  getRouteAction,
  getAlternateRouteAction,
  searchPoisAction
} from "@/actions/locationiq-actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import PointsOfInterest from "./points-of-interest"

const MapComponent = dynamic(
  () => import("./map-component"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] w-full items-center justify-center rounded-lg bg-gray-100">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }
)

interface ResultsMapProps {
  startLat: string
  startLng: string
  endLat: string
  endLng: string
  startAddress: string
  endAddress: string
  selectedRoute: "main" | "alternate"
  onRouteSelect: (route: "main" | "alternate") => void
}

interface RouteData {
  geometry: {
    coordinates: [number, number][]
  }
  duration: number
  distance: number
}

// Function to calculate the midpoint along a route
function getMidpoint(route: any) {
  if (!route) return null

  const coordinates = route.geometry.coordinates
  const totalDistance = route.distance

  // Find the point closest to 50% of the total distance
  let currentDistance = 0
  let midpointIndex = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = coordinates[i]
    const point2 = coordinates[i + 1]

    // Calculate distance between two points using the Haversine formula
    const lat1 = point1[1]
    const lon1 = point1[0]
    const lat2 = point2[1]
    const lon2 = point2[0]

    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const segmentDistance = R * c

    if (currentDistance + segmentDistance > totalDistance / 2) {
      // The midpoint lies on this segment
      const ratio = (totalDistance / 2 - currentDistance) / segmentDistance
      const midLat = lat1 + ratio * (lat2 - lat1)
      const midLon = lon1 + ratio * (lon2 - lon1)
      return { lat: midLat, lng: midLon }
    }

    currentDistance += segmentDistance
    midpointIndex++
  }

  // If we haven't found the midpoint (shouldn't happen), return the middle coordinate
  const middleIndex = Math.floor(coordinates.length / 2)
  return {
    lat: coordinates[middleIndex][1],
    lng: coordinates[middleIndex][0]
  }
}

export default function ResultsMap({
  startLat,
  startLng,
  endLat,
  endLng,
  startAddress,
  endAddress,
  selectedRoute,
  onRouteSelect
}: ResultsMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mainRoute, setMainRoute] = useState<RouteData | null>(null)
  const [alternateRoute, setAlternateRoute] = useState<RouteData | null>(null)
  const [showAlternateRoute, setShowAlternateRoute] = useState(false)
  const [showPois, setShowPois] = useState(true)
  const [isLoadingPois, setIsLoadingPois] = useState(false)
  const [currentPois, setCurrentPois] = useState<any[]>([])
  const [currentMidpoint, setCurrentMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [alternateMidpoint, setAlternateMidpoint] = useState<{ lat: number; lng: number } | null>(null)

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch routes on component mount
  useEffect(() => {
    const fetchRoutes = async () => {
      if (!isClient) return
      
      try {
        // Get both routes in parallel
        const [mainRouteRes, alternateRouteRes] = await Promise.all([
          getRouteAction(startLat, startLng, endLat, endLng),
          getAlternateRouteAction(startLat, startLng, endLat, endLng)
        ])

        if (mainRouteRes.isSuccess) {
          setMainRoute(mainRouteRes.data)
          // Set initial midpoint from main route
          const mainCoords = mainRouteRes.data.geometry.coordinates
          const mainMidIndex = Math.floor(mainCoords.length / 2)
          setCurrentMidpoint({
            lat: mainCoords[mainMidIndex][1],
            lng: mainCoords[mainMidIndex][0]
          })
        }

        if (alternateRouteRes.isSuccess) {
          setAlternateRoute(alternateRouteRes.data)
          setShowAlternateRoute(true)
          // Set alternate midpoint
          const altCoords = alternateRouteRes.data.geometry.coordinates
          const altMidIndex = Math.floor(altCoords.length / 2)
          setAlternateMidpoint({
            lat: altCoords[altMidIndex][1],
            lng: altCoords[altMidIndex][0]
          })
        }
      } catch (error) {
        console.error("Error fetching routes:", error)
      }
    }

    fetchRoutes()
  }, [startLat, startLng, endLat, endLng, isClient])

  // Fetch POIs when route or midpoint changes
  useEffect(() => {
    const fetchPois = async () => {
      if (!currentMidpoint || !showPois) return
      setIsLoadingPois(true)

      try {
        const result = await searchPoisAction(
          currentMidpoint.lat.toString(),
          currentMidpoint.lng.toString(),
          1500,
          [
            "restaurant",
            "cafe",
            "bar",
            "park",
            "library",
            "cinema",
            "theatre",
            "museum",
            "hotel",
            "supermarket",
            "shopping_mall"
          ]
        )

        if (result.isSuccess) {
          const poisWithRouteInfo = result.data.map((poi: any) => ({
            ...poi,
            selectedRoute
          }))
          setCurrentPois(poisWithRouteInfo)
        }
      } catch (error) {
        console.error("Error fetching POIs:", error)
      } finally {
        setIsLoadingPois(false)
      }
    }

    // Debounce POI fetching to prevent rapid API calls
    const timeoutId = setTimeout(() => {
      fetchPois()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [currentMidpoint?.lat, currentMidpoint?.lng, showPois])

  // Update current midpoint when route selection changes
  useEffect(() => {
    if (!mainRoute || !alternateRoute) return

    const route = selectedRoute === "main" ? mainRoute : alternateRoute
    const coords = route.geometry.coordinates
    const midIndex = Math.floor(coords.length / 2)
    
    setCurrentMidpoint({
      lat: coords[midIndex][1],
      lng: coords[midIndex][0]
    })
  }, [selectedRoute, mainRoute, alternateRoute])

  if (!isClient) {
    return (
      <Card className="h-[600px]">
        <CardContent className="p-0">
          <div className="bg-muted flex h-[600px] animate-pulse items-center justify-center rounded-lg border">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr,400px] gap-4">
      <Card className="h-[600px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Route Map</CardTitle>
            <div className="flex items-center gap-4">
              <Button
                variant={showPois ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPois(!showPois)}
                className="flex items-center gap-2"
                disabled={isLoadingPois}
              >
                <MapPin className="size-4" />
                {isLoadingPois
                  ? "Loading..."
                  : showPois
                    ? "Hide POIs"
                    : "Show POIs"}
              </Button>

              {alternateRoute && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-alternate">Show Alternate Route</Label>
                  <Switch
                    id="show-alternate"
                    checked={showAlternateRoute}
                    onCheckedChange={setShowAlternateRoute}
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-0">
          <MapComponent
            startLat={parseFloat(startLat) || 0}
            startLng={parseFloat(startLng) || 0}
            endLat={parseFloat(endLat) || 0}
            endLng={parseFloat(endLng) || 0}
            startAddress={startAddress}
            endAddress={endAddress}
            midpointLat={(currentMidpoint?.lat ?? parseFloat(startLat)) || 0}
            midpointLng={(currentMidpoint?.lng ?? parseFloat(startLng)) || 0}
            alternateMidpointLat={
              (alternateMidpoint?.lat ??
                currentMidpoint?.lat ??
                parseFloat(startLat)) ||
              0
            }
            alternateMidpointLng={
              (alternateMidpoint?.lng ??
                currentMidpoint?.lng ??
                parseFloat(startLng)) ||
              0
            }
            mainRoute={mainRoute}
            alternateRoute={alternateRoute}
            showAlternateRoute={showAlternateRoute}
            selectedRoute={selectedRoute}
            onRouteSelect={onRouteSelect}
            pois={currentPois}
            showPois={showPois}
          />

          {/* Route Summary */}
          <div className="absolute bottom-4 right-4 space-y-2">
            {mainRoute && (
              <Card
                className={`cursor-pointer p-2 transition-all ${
                  selectedRoute === "main" ? "border-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => onRouteSelect("main")}
              >
                <div className="text-sm font-medium">Main Route</div>
                <div className="text-muted-foreground text-xs">
                  {Math.round(mainRoute.duration / 60)} min •{" "}
                  {(mainRoute.distance * 0.000621371).toFixed(1)} mi
                </div>
              </Card>
            )}

            {alternateRoute && showAlternateRoute && (
              <Card
                className={`cursor-pointer p-2 transition-all ${
                  selectedRoute === "alternate"
                    ? "border-red-500 bg-red-50"
                    : ""
                }`}
                onClick={() => onRouteSelect("alternate")}
              >
                <div className="text-sm font-medium">Alternate Route</div>
                <div className="text-muted-foreground text-xs">
                  {Math.round(alternateRoute.duration / 60)} min •{" "}
                  {(alternateRoute.distance * 0.000621371).toFixed(1)} mi
                </div>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* POI Cards */}
      {showPois && (
        <PointsOfInterest
          pois={currentPois}
          startLat={parseFloat(startLat)}
          startLng={parseFloat(startLng)}
          endLat={parseFloat(endLat)}
          endLng={parseFloat(endLng)}
          startAddress={startAddress}
          endAddress={endAddress}
          selectedRoute={selectedRoute}
          midpointLat={currentMidpoint?.lat || parseFloat(startLat)}
          midpointLng={currentMidpoint?.lng || parseFloat(startLng)}
        />
      )}
    </div>
  )
}
