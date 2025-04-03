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
import { Loader2, MapPin } from "lucide-react"
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
  const [isPoiTravelTimeLoading, setIsPoiTravelTimeLoading] = useState(false)
  const [mainRoutePois, setMainRoutePois] = useState<PoiResponse[]>([])
  const [alternateRoutePois, setAlternateRoutePois] = useState<PoiResponse[]>([])
  const [currentMidpoint, setCurrentMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [alternateMidpoint, setAlternateMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [combinedPois, setCombinedPois] = useState<PoiResponse[]>([])
  const [selectedPoiId, setSelectedPoiId] = useState<string | undefined>(undefined)
  const [isMapDataLoading, setIsMapDataLoading] = useState(true)

  // Combine POIs from both routes, removing duplicates based on osm_id
  const uniquePois = useMemo(() => {
    if (!mainRoutePois || !alternateRoutePois) return [];
    
    const allPois = [...mainRoutePois, ...alternateRoutePois];
    const uniquePois = allPois.filter((poi, index, self) => 
      index === self.findIndex((p) => p.osm_id === poi.osm_id)
    );
    
    // Log POI counts and types
    console.log('POI counts:', {
      main: mainRoutePois.length,
      alternate: alternateRoutePois.length,
      combined: uniquePois.length
    });
    
    // Log POI types
    const poiTypes = uniquePois.reduce((acc, poi) => {
      acc[poi.type] = (acc[poi.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('POI types:', poiTypes);
    
    return uniquePois;
  }, [mainRoutePois, alternateRoutePois]);

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch routes and POIs together
  useEffect(() => {
    const fetchMapData = async () => {
      if (!isClient) return
      setIsMapDataLoading(true)
      let fetchedMainRoute: RouteData | null = null
      let fetchedAlternateRoute: RouteData | null = null
      let mainMidpoint: { lat: number; lng: number } | null = null
      let altMidpoint: { lat: number; lng: number } | null = null

      try {
        console.log('[MapData] Fetching routes...');
        const [mainRouteRes, alternateRouteRes] = await Promise.all([
          getRouteAction(startLat, startLng, endLat, endLng),
          getAlternateRouteAction(startLat, startLng, endLat, endLng)
        ])

        if (mainRouteRes.isSuccess) {
          fetchedMainRoute = mainRouteRes.data
          mainMidpoint = getMidpoint(mainRouteRes.data)
          setMainRoute(fetchedMainRoute)
          if (mainMidpoint) setCurrentMidpoint(mainMidpoint)
          console.log('[MapData] Main route and midpoint fetched.');
        } else {
          console.error('[MapData] Failed to fetch main route:', mainRouteRes.message);
        }

        if (alternateRouteRes.isSuccess) {
          fetchedAlternateRoute = alternateRouteRes.data
          altMidpoint = getMidpoint(alternateRouteRes.data)
          setAlternateRoute(fetchedAlternateRoute)
          if (altMidpoint) setAlternateMidpoint(altMidpoint)
          console.log('[MapData] Alternate route and midpoint fetched.');
        } else {
          console.error('[MapData] Failed to fetch alternate route:', alternateRouteRes.message);
        }

        if (mainMidpoint || altMidpoint) {
          console.log('[MapData] Fetching initial POIs...');
          const [mainPoisResult, altPoisResult] = await Promise.all([
            mainMidpoint ? searchPoisAction(mainMidpoint.lat.toString(), mainMidpoint.lng.toString(), 1000, ["amenity", "leisure", "tourism", "shop"]) : Promise.resolve({ isSuccess: false, data: [] }),
            altMidpoint ? searchPoisAction(altMidpoint.lat.toString(), altMidpoint.lng.toString(), 1000, ["amenity", "leisure", "tourism", "shop"]) : Promise.resolve({ isSuccess: false, data: [] })
          ]);

          const mainPois = mainPoisResult.isSuccess ? mainPoisResult.data || [] : [];
          const altPois = altPoisResult.isSuccess ? altPoisResult.data || [] : [];
          setMainRoutePois(mainPois);
          setAlternateRoutePois(altPois);

          const allPois = [...mainPois, ...altPois];
          const uniqueInitialPois = allPois.filter((poi, index, self) =>
            index === self.findIndex((p) => p.osm_id === poi.osm_id)
          );
          setCombinedPois(uniqueInitialPois);
          console.log(`[MapData] Initial POIs fetched: ${uniqueInitialPois.length}`);

          setIsMapDataLoading(false);

          if (uniqueInitialPois.length > 0) {
             setIsPoiTravelTimeLoading(true);
             console.log('[MapData] Starting background POI travel time calculation...');
             const batchSize = 5;
             const poiBatches = [];
             for (let i = 0; i < uniqueInitialPois.length; i += batchSize) {
               poiBatches.push(uniqueInitialPois.slice(i, i + batchSize));
             }

             let processedPoisWithTravelTime: PoiResponse[] = [];
             for (const batch of poiBatches) {
               const batchResults = await Promise.all(
                 batch.map(async (poi) => {
                   try {
                     const [startRoute, endRoute] = await Promise.all([
                       getRouteAction(startAddress.lat.toString(), startAddress.lng.toString(), poi.lat, poi.lon),
                       getRouteAction(poi.lat, poi.lon, endAddress.lat.toString(), endAddress.lng.toString()),
                     ]);
                     return {
                       ...poi,
                       distanceFromStart: startRoute.data?.distance,
                       distanceFromEnd: endRoute.data?.distance,
                       travelTimeFromStart: startRoute.data?.duration,
                       travelTimeFromEnd: endRoute.data?.duration,
                       travelTimeDifference: startRoute.data?.duration && endRoute.data?.duration ? Math.abs(startRoute.data.duration - endRoute.data.duration) : undefined,
                       totalTravelTime: startRoute.data?.duration && endRoute.data?.duration ? startRoute.data.duration + endRoute.data.duration : undefined,
                       isFavorite: false,
                     };
                   } catch (error) {
                     console.error(`[MapData] Error calculating travel times for POI ${poi.name}:`, error);
                     return poi;
                   }
                 })
               );
               processedPoisWithTravelTime = [...processedPoisWithTravelTime, ...batchResults];
               setCombinedPois(prevPois => {
                  const updatedPois = [...prevPois];
                  batchResults.forEach(updatedPoi => {
                    const index = updatedPois.findIndex(p => (p.osm_id || `${p.lat}-${p.lon}`) === (updatedPoi.osm_id || `${updatedPoi.lat}-${updatedPoi.lon}`));
                    if (index !== -1) {
                      updatedPois[index] = updatedPoi;
                    }
                  });
                  return updatedPois;
               });
             }
             console.log('[MapData] Background POI travel time calculation finished.');
             setIsPoiTravelTimeLoading(false);
           } else {
             console.log('[MapData] No POIs found, skipping travel time calculation.');
             setIsPoiTravelTimeLoading(false);
           }
        } else {
           console.log('[MapData] No midpoints found, skipping POI fetch.');
           setIsMapDataLoading(false);
        }

      } catch (error) {
        console.error("[MapData] Error fetching map data:", error)
        setIsMapDataLoading(false);
      }
    }

    fetchMapData()
  }, [startLat, startLng, endLat, endLng, isClient, startAddress, endAddress])

  // Debug logging for state changes
  useEffect(() => {
    console.log('State update:', {
      hasMainRoute: !!mainRoute,
      hasAlternateRoute: !!alternateRoute,
      currentMidpoint: currentMidpoint ? `${currentMidpoint.lat},${currentMidpoint.lng}` : null,
      alternateMidpoint: alternateMidpoint ? `${alternateMidpoint.lat},${alternateMidpoint.lng}` : null,
      showPois,
      mainRoutePoisCount: mainRoutePois.length,
      alternateRoutePoisCount: alternateRoutePois.length,
      currentPoisCount: combinedPois.length
    });
  }, [mainRoute, alternateRoute, currentMidpoint, alternateMidpoint, showPois, mainRoutePois, alternateRoutePois, combinedPois]);

  if (!isClient) {
    return (
      <Card className="h-[600px]">
        <CardContent className="p-0">
          <div className="bg-muted flex h-[600px] animate-pulse items-center justify-center rounded-lg border">
            <p className="text-muted-foreground">Initializing...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-4">
      {isMapDataLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-4 text-lg font-medium">Loading map data...</span>
        </div>
      )}

      <div className="space-y-4">
        <MapComponent
          startLat={startLat}
          startLng={startLng}
          endLat={endLat}
          endLng={endLng}
          startAddress={startAddress.display_name || ""}
          endAddress={endAddress.display_name || ""}
          midpointLat={currentMidpoint?.lat ?? parseFloat(startLat)}
          midpointLng={currentMidpoint?.lng ?? parseFloat(startLng)}
          alternateMidpointLat={alternateMidpoint?.lat ?? parseFloat(startLat)}
          alternateMidpointLng={alternateMidpoint?.lng ?? parseFloat(startLng)}
          mainRoute={mainRoute}
          alternateRoute={alternateRoute}
          showAlternateRoute={true}
          pois={combinedPois}
          showPois={showPois}
          selectedPoiId={selectedPoiId}
          onPoiSelect={(poiId) => setSelectedPoiId(poiId)}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-pois"
              checked={showPois}
              onCheckedChange={setShowPois}
              disabled={isMapDataLoading}
            />
            <Label htmlFor="show-pois">Show Points of Interest</Label>
          </div>
          {isPoiTravelTimeLoading && (
             <div className="flex items-center text-sm text-muted-foreground">
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               <span>Calculating POI travel times...</span>
             </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mainRoute && (
            <Card className="p-2">
              <div className="text-sm font-medium">Main Route</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(mainRoute.duration / 60)} min • {Math.round((mainRoute.distance / 1000) * 0.621371)} mi
              </div>
            </Card>
          )}
          {alternateRoute && (
            <Card className="p-2">
              <div className="text-sm font-medium">Alternate Route</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(alternateRoute.duration / 60)} min • {Math.round((alternateRoute.distance / 1000) * 0.621371)} mi
              </div>
            </Card>
          )}
        </div>
      </div>

      <div>
        <PointsOfInterest
          pois={combinedPois}
          isLoading={isPoiTravelTimeLoading}
          startLat={startLat}
          startLng={startLng}
          endLat={endLat}
          endLng={endLng}
          startAddress={startAddress.display_name || ""}
          endAddress={endAddress.display_name || ""}
          onPoiSelect={(poiId) => setSelectedPoiId(poiId)}
          midpointLat={currentMidpoint?.lat ?? parseFloat(startLat)}
          midpointLng={currentMidpoint?.lng ?? parseFloat(startLng)}
        />
      </div>
    </div>
  );
}
