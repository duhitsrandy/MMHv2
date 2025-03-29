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
import { PoiResponse } from "@/types/poi-types"

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
  startAddress: {
    lat: number
    lng: number
    display_name?: string
  }
  endAddress: {
    lat: number
    lng: number
    display_name?: string
  }
}

interface RouteData {
  geometry: {
    coordinates: [number, number][]
  }
  duration: number
  distance: number
  midpoint?: {
    lat: number
    lng: number
  }
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
  endAddress
}: ResultsMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mainRoute, setMainRoute] = useState<RouteData | null>(null)
  const [alternateRoute, setAlternateRoute] = useState<RouteData | null>(null)
  const [showPois, setShowPois] = useState(true)
  const [isLoadingPois, setIsLoadingPois] = useState(false)
  const [mainRoutePois, setMainRoutePois] = useState<PoiResponse[]>([])
  const [alternateRoutePois, setAlternateRoutePois] = useState<PoiResponse[]>([])
  const [currentMidpoint, setCurrentMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [alternateMidpoint, setAlternateMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [combinedPois, setCombinedPois] = useState<PoiResponse[]>([])

  // Combine POIs from both routes, removing duplicates based on osm_id
  const uniquePois = useMemo(() => {
    if (!mainRoutePois || !alternateRoutePois) return [];
    
    const allPois = [...mainRoutePois, ...alternateRoutePois];
    const uniquePois = allPois.filter((poi, index, self) => 
      index === self.findIndex((p) => p.osm_id === poi.osm_id)
    );
    
    return uniquePois;
  }, [mainRoutePois, alternateRoutePois]);

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
            setCurrentMidpoint(mainMidpoint);
          }
        }

        if (alternateRouteRes.isSuccess) {
          setAlternateRoute(alternateRouteRes.data)
          const altMidpoint = getMidpoint(alternateRouteRes.data);
          if (altMidpoint) {
            setAlternateMidpoint(altMidpoint);
          }
        }
      } catch (error) {
        console.error("Error fetching routes:", error)
      }
    }

    fetchRoutes()
  }, [startLat, startLng, endLat, endLng, isClient])

  // Update POIs when routes change
  useEffect(() => {
    if (!mainRoute || !alternateRoute) return;

    const fetchPois = async () => {
      try {
        setIsLoadingPois(true);
        
        // Fetch POIs for main route midpoint
        const mainPoisResult = await searchPoisAction(
          currentMidpoint?.lat.toString() || "",
          currentMidpoint?.lng.toString() || "",
          1000,
          ["amenity", "leisure", "tourism", "shop"]
        );
        if (mainPoisResult.isSuccess && mainPoisResult.data) {
          setMainRoutePois(mainPoisResult.data);
        }

        // Fetch POIs for alternate route midpoint
        const altPoisResult = await searchPoisAction(
          alternateMidpoint?.lat.toString() || "",
          alternateMidpoint?.lng.toString() || "",
          1000,
          ["amenity", "leisure", "tourism", "shop"]
        );
        if (altPoisResult.isSuccess && altPoisResult.data) {
          setAlternateRoutePois(altPoisResult.data);
        }

        // Wait for both POI sets to be loaded
        const allPois = [...(mainPoisResult.data || []), ...(altPoisResult.data || [])];
        const uniquePois = allPois.filter((poi, index, self) => 
          index === self.findIndex((p) => p.osm_id === poi.osm_id)
        );

        // Calculate travel times and distances for all POIs
        const poisWithTravelInfo = await Promise.all(
          uniquePois.map(async (poi) => {
            try {
              const [startRoute, endRoute] = await Promise.all([
                getRouteAction(
                  startAddress.lat.toString(),
                  startAddress.lng.toString(),
                  poi.lat,
                  poi.lon
                ),
                getRouteAction(
                  poi.lat,
                  poi.lon,
                  endAddress.lat.toString(),
                  endAddress.lng.toString()
                ),
              ]);

              const poiWithTravelInfo = {
                ...poi,
                distanceFromStart: startRoute.data?.distance,
                distanceFromEnd: endRoute.data?.distance,
                travelTimeFromStart: startRoute.data?.duration,
                travelTimeFromEnd: endRoute.data?.duration,
                travelTimeDifference: startRoute.data?.duration && endRoute.data?.duration 
                  ? Math.abs(startRoute.data.duration - endRoute.data.duration)
                  : undefined,
                totalTravelTime: startRoute.data?.duration && endRoute.data?.duration
                  ? startRoute.data.duration + endRoute.data.duration
                  : undefined,
                isFavorite: false,
              };

              return poiWithTravelInfo;
            } catch (error) {
              console.error(`Error calculating travel times for POI ${poi.name}:`, error);
              return poi; // Return the POI without travel times if calculation fails
            }
          })
        );

        setCombinedPois(poisWithTravelInfo);
      } catch (error) {
        console.error("Error fetching POIs:", error);
      } finally {
        setIsLoadingPois(false);
      }
    };

    fetchPois();
  }, [mainRoute, alternateRoute, startAddress, endAddress, currentMidpoint, alternateMidpoint]);

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-4">
      <div className="space-y-4">
        <MapComponent
          startLat={startLat}
          startLng={startLng}
          endLat={endLat}
          endLng={endLng}
          startAddress={startAddress.display_name || ""}
          endAddress={endAddress.display_name || ""}
          midpointLat={currentMidpoint?.lat || parseFloat(startLat)}
          midpointLng={currentMidpoint?.lng || parseFloat(startLng)}
          alternateMidpointLat={alternateMidpoint?.lat || parseFloat(startLat)}
          alternateMidpointLng={alternateMidpoint?.lng || parseFloat(startLng)}
          mainRoute={mainRoute}
          alternateRoute={alternateRoute}
          showAlternateRoute={true}
          pois={combinedPois}
          showPois={showPois}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-pois"
              checked={showPois}
              onCheckedChange={setShowPois}
            />
            <Label htmlFor="show-pois">Show Points of Interest</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mainRoute && (
            <Card className="p-2">
              <div className="text-sm font-medium">Main Route</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(mainRoute.duration / 60)} min • {Math.round(mainRoute.distance / 1000)} km
              </div>
            </Card>
          )}
          {alternateRoute && (
            <Card className="p-2">
              <div className="text-sm font-medium">Alternate Route</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(alternateRoute.duration / 60)} min • {Math.round(alternateRoute.distance / 1000)} km
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <PointsOfInterest
          pois={combinedPois}
          startLat={parseFloat(startLat)}
          startLng={parseFloat(startLng)}
          endLat={parseFloat(endLat)}
          endLng={parseFloat(endLng)}
          startAddress={startAddress.display_name || ""}
          endAddress={endAddress.display_name || ""}
        />
      </div>
    </div>
  )
}
