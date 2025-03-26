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
  endAddress
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
    console.log('[POI Switch] Computing current POIs:', {
      mainRoutePoisCount: mainRoutePois.length,
      alternateRoutePoisCount: alternateRoutePois.length,
      showPois,
      mainRoutePoisTypes: mainRoutePois.reduce((acc: any, poi: any) => {
        acc[poi.type] = (acc[poi.type] || 0) + 1;
        return acc;
      }, {}),
      alternateRoutePoisTypes: alternateRoutePois.reduce((acc: any, poi: any) => {
        acc[poi.type] = (acc[poi.type] || 0) + 1;
        return acc;
      }, {})
    });
    
    if (!showPois) return [];
    
    // Combine POIs from both routes, removing duplicates based on osm_id
    const uniquePois = new Map<string, any>();
    
    // Add main route POIs first
    mainRoutePois.forEach(poi => {
      uniquePois.set(poi.osm_id, poi);
    });
    
    // Add alternate route POIs, only if they don't exist
    alternateRoutePois.forEach(poi => {
      if (!uniquePois.has(poi.osm_id)) {
        uniquePois.set(poi.osm_id, poi);
      }
    });
    
    const allPois = Array.from(uniquePois.values());
    
    console.log('[POI Switch] Combined POIs:', {
      total: allPois.length,
      mainRouteCount: mainRoutePois.length,
      alternateRouteCount: alternateRoutePois.length,
      types: allPois.reduce((acc: any, poi: any) => {
        acc[poi.type] = (acc[poi.type] || 0) + 1;
        return acc;
      }, {})
    });
    
    return allPois;
  }, [showPois, mainRoutePois, alternateRoutePois]);

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
      currentPoisCount: currentPois.length
    });
  }, [mainRoute, alternateRoute, currentMidpoint, alternateMidpoint, showPois, mainRoutePois, alternateRoutePois, currentPois]);

  // Fetch POIs when midpoints change
  useEffect(() => {
    if (!showPois) return;

    console.log('[POI Fetch] Midpoints changed:', {
      current: currentMidpoint,
      alternate: alternateMidpoint,
      showPois,
      mainRoutePoisCount: mainRoutePois.length,
      alternateRoutePoisCount: alternateRoutePois.length
    });

    const controller = new AbortController();

    const fetchPois = async (lat: string, lng: string, isAlternate: boolean = false) => {
      try {
        console.log(`[POI Fetch] Starting POI fetch for ${isAlternate ? 'alternate' : 'main'} midpoint:`, { lat, lng });
        const result = await searchPoisAction(lat, lng);
        
        console.log(`[POI Fetch] ${isAlternate ? 'Alternate' : 'Main'} midpoint POI search result:`, {
          success: result.isSuccess,
          count: result.data?.length || 0,
          message: result.message
        });

        if (result.isSuccess && result.data) {
          // Merge new POIs with existing ones, removing duplicates based on osm_id
          if (isAlternate) {
            setAlternateRoutePois(prev => {
              const newPois = result.data || [];
              const existingIds = new Set(prev.map(p => p.osm_id));
              const uniqueNewPois = newPois.filter(p => !existingIds.has(p.osm_id));
              console.log(`[POI Fetch] Updated alternate route POIs:`, {
                previousCount: prev.length,
                newCount: uniqueNewPois.length,
                totalCount: prev.length + uniqueNewPois.length
              });
              return [...prev, ...uniqueNewPois];
            });
          } else {
            setMainRoutePois(prev => {
              const newPois = result.data || [];
              const existingIds = new Set(prev.map(p => p.osm_id));
              const uniqueNewPois = newPois.filter(p => !existingIds.has(p.osm_id));
              console.log(`[POI Fetch] Updated main route POIs:`, {
                previousCount: prev.length,
                newCount: uniqueNewPois.length,
                totalCount: prev.length + uniqueNewPois.length
              });
              return [...prev, ...uniqueNewPois];
            });
          }
        }
      } catch (error) {
        console.error(`[POI Fetch] Error fetching POIs for ${isAlternate ? 'alternate' : 'main'} midpoint:`, error);
      }
    };

    // Fetch POIs for both midpoints
    if (currentMidpoint?.lat && currentMidpoint?.lng) {
      fetchPois(currentMidpoint.lat.toString(), currentMidpoint.lng.toString(), false);
    }
    if (alternateMidpoint?.lat && alternateMidpoint?.lng) {
      fetchPois(alternateMidpoint.lat.toString(), alternateMidpoint.lng.toString(), true);
    }

    return () => controller.abort();
  }, [currentMidpoint, alternateMidpoint, showPois]);

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-4">
      <div className="space-y-4">
        <MapComponent
          startLat={startLat}
          startLng={startLng}
          endLat={endLat}
          endLng={endLng}
          startAddress={startAddress}
          endAddress={endAddress}
          midpointLat={currentMidpoint?.lat || parseFloat(startLat)}
          midpointLng={currentMidpoint?.lng || parseFloat(startLng)}
          alternateMidpointLat={alternateMidpoint?.lat || parseFloat(startLat)}
          alternateMidpointLng={alternateMidpoint?.lng || parseFloat(startLng)}
          mainRoute={mainRoute}
          alternateRoute={alternateRoute}
          showAlternateRoute={true}
          pois={currentPois}
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
          pois={currentPois}
          startLat={parseFloat(startLat)}
          startLng={parseFloat(startLng)}
          endLat={parseFloat(endLat)}
          endLng={parseFloat(endLng)}
          startAddress={startAddress}
          endAddress={endAddress}
        />
      </div>
    </div>
  )
}
