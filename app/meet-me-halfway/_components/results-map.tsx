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
  const [selectedPoiId, setSelectedPoiId] = useState<string | undefined>(undefined)

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

  // Update POIs when routes change
  useEffect(() => {
    if (!mainRoute || !alternateRoute) return;

    const fetchPois = async () => {
      try {
        setIsLoadingPois(true);
        console.log('Starting POI fetch process...');
        
        // Fetch POIs for main route midpoint
        console.log('Fetching POIs for main route midpoint:', currentMidpoint);
        const mainPoisResult = await searchPoisAction(
          currentMidpoint?.lat.toString() || "",
          currentMidpoint?.lng.toString() || "",
          1000,
          ["amenity", "leisure", "tourism", "shop"]
        );
        if (mainPoisResult.isSuccess && mainPoisResult.data) {
          console.log('Main route POIs:', mainPoisResult.data);
          setMainRoutePois(mainPoisResult.data);
        }

        // Fetch POIs for alternate route midpoint
        console.log('Fetching POIs for alternate route midpoint:', alternateMidpoint);
        const altPoisResult = await searchPoisAction(
          alternateMidpoint?.lat.toString() || "",
          alternateMidpoint?.lng.toString() || "",
          1000,
          ["amenity", "leisure", "tourism", "shop"]
        );
        if (altPoisResult.isSuccess && altPoisResult.data) {
          console.log('Alternate route POIs:', altPoisResult.data);
          setAlternateRoutePois(altPoisResult.data);
        }

        // Wait for both POI sets to be loaded
        const allPois = [...(mainPoisResult.data || []), ...(altPoisResult.data || [])];
        const uniquePois = allPois.filter((poi, index, self) => 
          index === self.findIndex((p) => p.osm_id === poi.osm_id)
        );
        console.log('Combined unique POIs:', uniquePois);
        
        // Immediately show POIs on the map without travel times
        setCombinedPois(uniquePois);
        
        // Calculate travel times and distances for all POIs in the background
        console.log('Starting travel time calculations...');
        
        // Create batches of POIs to process in parallel (5 POIs per batch)
        // This prevents overwhelming the API with too many simultaneous requests
        const batchSize = 5;
        const poiBatches = [];
        
        for (let i = 0; i < uniquePois.length; i += batchSize) {
          poiBatches.push(uniquePois.slice(i, i + batchSize));
        }
        
        // Process each batch sequentially, but process POIs within each batch in parallel
        let allProcessedPois: PoiResponse[] = [];
        
        for (const batch of poiBatches) {
          const batchResults = await Promise.all(
            batch.map(async (poi) => {
              try {
                console.log(`Calculating travel times for POI: ${poi.name}`);
                
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

                return {
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
              } catch (error) {
                console.error(`Error calculating travel times for POI ${poi.name}:`, error);
                return poi; // Return the POI without travel times if calculation fails
              }
            })
          );
          
          allProcessedPois = [...allProcessedPois, ...batchResults];
          
          // Update UI after each batch completes
          setCombinedPois(allProcessedPois);
        }

        console.log('Final POIs with travel info:', allProcessedPois);
        
        // Final update to ensure all POIs are displayed
        setCombinedPois(allProcessedPois);
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
    );
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
          selectedPoiId={selectedPoiId}
          onPoiSelect={(poiId) => setSelectedPoiId(poiId)}
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
          startLat={startLat}
          startLng={startLng}
          endLat={endLat}
          endLng={endLng}
          startAddress={startAddress.display_name || ""}
          endAddress={endAddress.display_name || ""}
          onPoiSelect={(poiId) => setSelectedPoiId(poiId)}
          midpointLat={currentMidpoint?.lat || ""}
          midpointLng={currentMidpoint?.lng || ""}
        />
      </div>
    </div>
  );
}
