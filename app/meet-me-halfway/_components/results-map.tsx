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
  const [showPois, setShowPois] = useState(true)
  const [isLoadingPois, setIsLoadingPois] = useState(false)
  const [mainRoutePois, setMainRoutePois] = useState<any[]>([])
  const [alternateRoutePois, setAlternateRoutePois] = useState<any[]>([])
  const [currentMidpoint, setCurrentMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [alternateMidpoint, setAlternateMidpoint] = useState<{ lat: number; lng: number } | null>(null)

  // Compute current POIs based on selected route
  const currentPois = useMemo(() => {
    return selectedRoute === 'main' ? mainRoutePois : alternateRoutePois;
  }, [selectedRoute, mainRoutePois, alternateRoutePois]);

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
          const mainMidpoint = getMidpoint(mainRouteRes.data);
          if (mainMidpoint) {
            console.log('Setting main route midpoint:', mainMidpoint);
            setCurrentMidpoint(mainMidpoint);
          }
        }

        if (alternateRouteRes.isSuccess) {
          setAlternateRoute(alternateRouteRes.data)
          const altMidpoint = getMidpoint(alternateRouteRes.data);
          if (altMidpoint) {
            console.log('Setting alternate route midpoint:', altMidpoint);
            setAlternateMidpoint(altMidpoint);
          }
        }
      } catch (error) {
        console.error("Error fetching routes:", error)
      }
    }

    fetchRoutes()
  }, [startLat, startLng, endLat, endLng, isClient])

  // Fetch POIs when route or midpoint changes
  useEffect(() => {
    const fetchPoisForRoute = async (
      midpoint: { lat: number; lng: number } | null,
      isMainRoute: boolean
    ) => {
      if (!midpoint || !showPois) return;

      console.log(`Fetching POIs for ${isMainRoute ? 'main' : 'alternate'} route:`, {
        lat: midpoint.lat.toString(),
        lng: midpoint.lng.toString()
      });

      try {
        const result = await searchPoisAction(
          midpoint.lat.toString(),
          midpoint.lng.toString(),
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
        );

        console.log(`${isMainRoute ? 'Main' : 'Alternate'} route POI search result:`, result);

        if (result.isSuccess) {
          const poisWithRouteInfo = result.data.map((poi: any) => ({
            ...poi,
            selectedRoute: isMainRoute ? 'main' : 'alternate'
          }));
          
          if (isMainRoute) {
            console.log('Setting main route POIs:', poisWithRouteInfo);
            setMainRoutePois(poisWithRouteInfo);
          } else {
            console.log('Setting alternate route POIs:', poisWithRouteInfo);
            setAlternateRoutePois(poisWithRouteInfo);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${isMainRoute ? 'main' : 'alternate'} route POIs:`, error);
      }
    };

    // Fetch POIs for both routes independently
    if (currentMidpoint) {
      setIsLoadingPois(true);
      fetchPoisForRoute(currentMidpoint, true);
    }

    if (alternateMidpoint) {
      setIsLoadingPois(true);
      fetchPoisForRoute(alternateMidpoint, false);
    }

    // Set loading to false after both fetches complete
    const timeoutId = setTimeout(() => {
      setIsLoadingPois(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentMidpoint?.lat, currentMidpoint?.lng, alternateMidpoint?.lat, alternateMidpoint?.lng, showPois, selectedRoute]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('State update:', {
      hasMainRoute: !!mainRoute,
      hasAlternateRoute: !!alternateRoute,
      selectedRoute,
      currentMidpoint,
      alternateMidpoint,
      showPois,
      mainRoutePoisCount: mainRoutePois.length,
      alternateRoutePoisCount: alternateRoutePois.length,
      currentPoisCount: currentPois.length
    });
  }, [mainRoute, alternateRoute, selectedRoute, currentMidpoint, alternateMidpoint, showPois, mainRoutePois, alternateRoutePois, currentPois]);

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
            showAlternateRoute={true}
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

            {alternateRoute && (
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
