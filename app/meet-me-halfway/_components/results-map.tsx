"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import {
  getRouteAction,
  getAlternateRouteAction,
  searchPoisAction
} from "@/actions/locationiq-actions"
import { getTravelTimeMatrixAction } from "@/actions/ors-actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Route } from "lucide-react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { PoiResponse, EnrichedPoi, TravelInfo } from "@/types/poi-types"
import { ActionState } from "@/types"
import { OsrmRoute } from "@/types/meet-me-halfway-types"
import { GeocodedOrigin, Point, UserPlan } from "@/types"
import { usePlan } from "@/hooks/usePlan"
import { calculateCentroid, calculateMidpointFromRoute } from "@/lib/geo-utils"
import { toast } from "sonner"
import ResultsSkeleton from "./results-skeleton"

interface MapComponentProps {
  mainRoute?: OsrmRoute | null
  alternateRoute?: OsrmRoute | null
  pois?: PoiResponse[]
  midpoint?: { lat: number; lng: number } | null
  alternateMidpoint?: { lat: number; lng: number } | null
  startAddress: string
  endAddress: string
  startLat: string | number
  startLng: string | number
  endLat: string | number
  endLng: string | number
  midpointLat: number
  midpointLng: number
  alternateMidpointLat: number
  alternateMidpointLng: number
  selectedPoiId?: string
  onPoiSelect?: (poiId: string) => void
  isLoading?: boolean
  showPois: boolean
}

interface ResultsMapProps {
  geocodedOrigins: GeocodedOrigin[]
}

interface UseMapDataReturn {
  mainRoute: OsrmRoute | null;
  alternateRoute: OsrmRoute | null;
  currentMidpoint: { lat: number; lng: number } | null;
  alternateMidpoint: { lat: number; lng: number } | null;
  centralMidpoint: { lat: number; lng: number } | null;
  initialPois: PoiResponse[];
  combinedPois: EnrichedPoi[];
  isMapDataLoading: boolean;
  isPoiTravelTimeLoading: boolean;
  mapError: string | null;
  poiError: string | null;
  matrixError: string | null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function getMidpoint(route: OsrmRoute | null): { lat: number; lng: number } | null {
  if (!route?.geometry?.coordinates || route.geometry.coordinates.length < 2) return null

  const coordinates = route.geometry.coordinates
  const totalDistance = route.distance
  const targetDistance = totalDistance / 2
  let cumulativeDistance = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i]
    const [lon2, lat2] = coordinates[i + 1]
    
    const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2)

    if (cumulativeDistance + segmentDistance >= targetDistance) {
      const remainingDistance = targetDistance - cumulativeDistance
      const ratio = segmentDistance === 0 ? 0 : remainingDistance / segmentDistance
      const midLat = lat1 + ratio * (lat2 - lat1)
      const midLon = lon1 + ratio * (lon2 - lon1)
      return { lat: midLat, lng: midLon }
    }
    cumulativeDistance += segmentDistance
  }

  const lastCoord = coordinates[coordinates.length - 1]
  return { lat: lastCoord[1], lng: lastCoord[0] }
}

function useMapData({ geocodedOrigins }: ResultsMapProps): UseMapDataReturn {
  const { plan } = usePlan();

  const [mainRoute, setMainRoute] = useState<OsrmRoute | null>(null)
  const [alternateRoute, setAlternateRoute] = useState<OsrmRoute | null>(null)
  const [currentMidpoint, setCurrentMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [alternateMidpoint, setAlternateMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [centralMidpoint, setCentralMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [initialPois, setInitialPois] = useState<PoiResponse[]>([])
  const [combinedPois, setCombinedPois] = useState<EnrichedPoi[]>([])
  const [isMapDataLoading, setIsMapDataLoading] = useState(true)
  const [isPoiTravelTimeLoading, setIsPoiTravelTimeLoading] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [poiError, setPoiError] = useState<string | null>(null)
  const [matrixError, setMatrixError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMapData = async () => {
      if (!geocodedOrigins || geocodedOrigins.length < 2) {
        setMapError("Insufficient location data provided.");
        setIsMapDataLoading(false);
        return;
      }

      setIsMapDataLoading(true)
      setIsPoiTravelTimeLoading(false)
      setMapError(null)
      setPoiError(null)
      setMatrixError(null)
      setMainRoute(null)
      setAlternateRoute(null)
      setCurrentMidpoint(null)
      setAlternateMidpoint(null)
      setCentralMidpoint(null)
      setInitialPois([])
      setCombinedPois([])

      try {
        let fetchedMainRoute: OsrmRoute | null = null
        let fetchedAlternateRoute: OsrmRoute | null = null
        let calculatedMidpoint: { lat: number; lng: number } | null = null
        let calculatedAlternateMidpoint: { lat: number; lng: number } | null = null
        let calculatedCentralMidpoint: { lat: number; lng: number } | null = null
        let poiSearchCoords: { lat: number; lng: number }[] = []
        let matrixSourceCoords: { lat: string; lng: string; }[] = []
        let bestMeetingPoi: EnrichedPoi | null = null;
        let originRoutes: OsrmRoute[] = []; // Placeholder for routes from origins to best POI

        if (geocodedOrigins.length === 2) {
          console.log('[MapData] Fetching for 2 origins...')
          const startLat = geocodedOrigins[0].lat
          const startLng = geocodedOrigins[0].lng
          const endLat = geocodedOrigins[1].lat
          const endLng = geocodedOrigins[1].lng

          const [mainRouteRes, alternateRouteRes] = await Promise.all([
            getRouteAction({ startLat, startLon: startLng, endLat, endLon: endLng }),
            getAlternateRouteAction({ startLat, startLon: startLng, endLat, endLon: endLng })
          ])

          if (!mainRouteRes.isSuccess || !mainRouteRes.data) {
            throw new Error(`Failed to fetch main route: ${mainRouteRes.message}`)
          }
          fetchedMainRoute = mainRouteRes.data
          fetchedAlternateRoute = alternateRouteRes.isSuccess ? alternateRouteRes.data : null

          calculatedMidpoint = calculateMidpointFromRoute(fetchedMainRoute)
          calculatedAlternateMidpoint = fetchedAlternateRoute ? calculateMidpointFromRoute(fetchedAlternateRoute) : null

          if (calculatedMidpoint) poiSearchCoords.push(calculatedMidpoint)
          if (calculatedAlternateMidpoint) poiSearchCoords.push(calculatedAlternateMidpoint)

          matrixSourceCoords = [
            { lat: startLat, lng: startLng },
            { lat: endLat, lng: endLng },
          ]

          // --- Step 2: Fetch POIs around each midpoint (current + alternate) ---
          if (poiSearchCoords.length > 0) {
            console.log('[MapData] Fetching POIs around midpoints:', poiSearchCoords)
            setIsPoiTravelTimeLoading(true)

            let aggregatedPois: PoiResponse[] = []

            for (const coord of poiSearchCoords) {
              const poiRes = await searchPoisAction({
                lat: String(coord.lat),
                lon: String(coord.lng)
              })

              if (poiRes.isSuccess && poiRes.data) {
                aggregatedPois = aggregatedPois.concat(poiRes.data)
              } else {
                console.warn(`[MapData] POI search failed at (${coord.lat},${coord.lng}): ${poiRes.message}`)
              }
            }

            // Deduplicate POIs (prefer osm_id, fallback to lat/lon combo)
            const uniquePoiMap = new Map<string, PoiResponse>()
            aggregatedPois.forEach(poi => {
              const key = poi.osm_id || `${poi.lat}-${poi.lon}`
              if (!uniquePoiMap.has(key)) {
                uniquePoiMap.set(key, poi)
              }
            })
            const uniqueInitialPois = Array.from(uniquePoiMap.values())
            setInitialPois(uniqueInitialPois)
            console.log(`[MapData] Found ${uniqueInitialPois.length} unique POIs for 2-origin search.`)

            // --- Step 3: Fetch travel time matrix from each origin to each POI ---
            if (uniqueInitialPois.length > 0) {
              const allPoints = [
                ...matrixSourceCoords.map(c => ({ lon: c.lng, lat: c.lat })), // Origins (sources)
                ...uniqueInitialPois.map(p => ({ lon: p.lon, lat: p.lat }))     // POIs (destinations)
              ]
              const coordinatesString = allPoints.map(p => `${p.lon},${p.lat}`).join(';')
              const sourcesString = matrixSourceCoords.map((_, idx) => idx).join(';') // "0;1"
              const destinationsString = uniqueInitialPois.map((_, idx) => idx + matrixSourceCoords.length).join(';')

              const matrixResult = await getTravelTimeMatrixAction(
                coordinatesString,
                sourcesString,
                destinationsString
              )

              if (!matrixResult.isSuccess || !matrixResult.data?.durations) {
                console.error('[MapData] Matrix fetch failed:', matrixResult.message)
                setMatrixError(matrixResult.message || 'Failed to fetch travel times')
                setCombinedPois(uniqueInitialPois.map(p => ({ ...p, travelInfo: [] })))
              } else {
                const poisWithTravelTimes = uniqueInitialPois.map((poi, poiIdx): EnrichedPoi => {
                  const travelInfo: TravelInfo[] = []
                  matrixSourceCoords.forEach((_, srcIdx) => {
                    const duration = matrixResult.data?.durations?.[srcIdx]?.[poiIdx]
                    const distance = matrixResult.data?.distances?.[srcIdx]?.[poiIdx]
                    travelInfo.push({
                      sourceIndex: srcIdx,
                      duration: duration ?? null,
                      distance: distance ?? null
                    })
                  })
                  return { ...poi, travelInfo }
                })
                setCombinedPois(poisWithTravelTimes)
              }
            } else {
              setCombinedPois([])
            }
          } else {
            console.warn('[MapData] No midpoints calculated, cannot fetch POIs for 2 origins.')
          }
        } else if (geocodedOrigins.length > 2) {
          if (plan !== 'pro') {
            throw new Error("Calculating midpoint for more than two locations requires a Pro plan.")
          }
          console.log('[MapData] Calculating for >2 origins...')

          // 1. Calculate Geometric Centroid
          calculatedCentralMidpoint = calculateCentroid(geocodedOrigins.map(o => ({ lat: parseFloat(o.lat), lng: parseFloat(o.lng) })));
          if (!calculatedCentralMidpoint) {
            throw new Error("Failed to calculate initial central midpoint.");
          }
          poiSearchCoords.push(calculatedCentralMidpoint);
          matrixSourceCoords = geocodedOrigins.map(o => ({ lat: o.lat, lng: o.lng }));

          // --- Steps 2 & 3: Fetch POIs and Matrix (moved inside this block) ---
          if (poiSearchCoords.length > 0) {
              console.log('[MapData] Fetching POIs around centroid:', poiSearchCoords[0])
              setIsPoiTravelTimeLoading(true)

              const poiResult = await searchPoisAction({
                  lat: String(poiSearchCoords[0].lat),
                  lon: String(poiSearchCoords[0].lng)
              });

              let uniqueInitialPois: PoiResponse[] = [];
              if (!poiResult.isSuccess || !poiResult.data) {
                  console.warn(`POI search failed: ${poiResult.message}`);
                  setPoiError(poiResult.message || "Failed to fetch POIs");
              } else {
                  const uniquePoiMap = new Map<string, PoiResponse>();
                  poiResult.data.forEach(poi => {
                      const key = poi.osm_id; // Use osm_id as key
                      if (key && !uniquePoiMap.has(key)) {
                          uniquePoiMap.set(key, poi);
                      }
                  });
                  uniqueInitialPois = Array.from(uniquePoiMap.values());
                  setInitialPois(uniqueInitialPois);
                  console.log(`[MapData] Found ${uniqueInitialPois.length} unique initial POIs near centroid.`);
              }

              if (uniqueInitialPois.length > 0 && matrixSourceCoords.length > 0) {
                  console.log(`[MapData] Fetching travel matrix for >2 origins. Sources: ${matrixSourceCoords.length}, Destinations: ${uniqueInitialPois.length}`);
                  const allPoints = [
                      ...matrixSourceCoords.map(c => ({ lon: c.lng, lat: c.lat })), // Sources
                      ...uniqueInitialPois.map(p => ({ lon: p.lon, lat: p.lat })) // POIs
                  ];
                  const coordinatesString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');
                  const sourcesString = matrixSourceCoords.map((_, index) => index).join(';');
                  const destinationsString = uniqueInitialPois.map((_, index) => index + matrixSourceCoords.length).join(';');

                  const matrixResult = await getTravelTimeMatrixAction(
                      coordinatesString,
                      sourcesString,
                      destinationsString
                  );

                  if (!matrixResult.isSuccess || !matrixResult.data?.durations) {
                      console.error("Matrix fetch failed:", matrixResult.message);
                      setMatrixError(matrixResult.message || "Failed to fetch travel times");
                      // Set combined POIs without travel times or handle error differently
                      setCombinedPois(uniqueInitialPois.map(p => ({ ...p, travelInfo: [] }))); // Set empty travelInfo
                  } else {
                      console.log('[MapData] Matrix data received for >2 origins:', matrixResult.data);
                      const poisWithTravelTimes = uniqueInitialPois.map((poi, poiIndex): EnrichedPoi => {
                          const travelInfo: TravelInfo[] = [];
                          matrixSourceCoords.forEach((source, sourceIndex) => {
                              const duration = matrixResult.data?.durations?.[sourceIndex]?.[poiIndex];
                              const distance = matrixResult.data?.distances?.[sourceIndex]?.[poiIndex];
                              travelInfo.push({
                                  sourceIndex: sourceIndex,
                                  duration: duration ?? null,
                                  distance: distance ?? null
                              });
                          });
                          return { ...poi, travelInfo };
                      });
                      setCombinedPois(poisWithTravelTimes);

                      // --- REMOVED Step 4: Find Best Meeting POI --- 
                      // We will let the user select the POI from the list.
                      // The `combinedPois` state now holds all POIs with travel times.
                      // --------------------------------------------------
                  }
              } else {
                  setCombinedPois([]); // No POIs found or matrix failed
              }
          } else {
            console.warn('[MapData] No centroid calculated, cannot fetch POIs.');
            setInitialPois([]);
            setCombinedPois([]);
          }
          // --- End POI/Matrix Fetch ---

          // Nullify route-specific variables for >2 case
          fetchedMainRoute = null;
          fetchedAlternateRoute = null;
          calculatedMidpoint = null;
          calculatedAlternateMidpoint = null;
        }

        // Set state based on calculations
        setMainRoute(fetchedMainRoute);
        setAlternateRoute(fetchedAlternateRoute);
        setCurrentMidpoint(calculatedMidpoint);
        setAlternateMidpoint(calculatedAlternateMidpoint);
        setCentralMidpoint(calculatedCentralMidpoint); // Still set the geometric centroid
        // TODO: Set meetingPoint state based on bestMeetingPoi
        // TODO: Set originRoutes state after fetching them

      } catch (error: any) {
        console.error("[MapData] Error during data fetching:", error)
        setMapError(error.message || "An unexpected error occurred.")
        setMainRoute(null)
        setAlternateRoute(null)
        setInitialPois([])
        setCombinedPois([])
      } finally {
        setIsMapDataLoading(false)
        setIsPoiTravelTimeLoading(false)
      }
    }

    fetchMapData()
  }, [geocodedOrigins, plan])

  console.log('[MapData Debug] Returning Hook State:', {
    mainRoute: !!mainRoute,
    alternateRoute: !!alternateRoute,
    currentMidpoint: !!currentMidpoint,
    alternateMidpoint: !!alternateMidpoint,
    centralMidpoint: !!centralMidpoint,
    initialPoisCount: initialPois.length,
    combinedPoisCount: combinedPois.length,
    isMapDataLoading,
    isPoiTravelTimeLoading,
    mapError,
    poiError,
    matrixError,
  })

  return {
    mainRoute,
    alternateRoute,
    currentMidpoint,
    alternateMidpoint,
    centralMidpoint,
    initialPois,
    combinedPois,
    isMapDataLoading,
    isPoiTravelTimeLoading,
    mapError,
    poiError,
    matrixError,
  }
}

// Dynamic import for MapComponent
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

const PointsOfInterest = dynamic(
  () => import("./points-of-interest").then((mod) => mod.default),
  {
    loading: () => (
      <div className="flex h-[200px] items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading POIs...</div>
      </div>
    ),
    ssr: false
  }
)

export default function ResultsMap({ geocodedOrigins }: ResultsMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedPoiId, setSelectedPoiId] = useState<string | undefined>(undefined)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const {
    mainRoute,
    alternateRoute,
    currentMidpoint,
    alternateMidpoint,
    centralMidpoint,
    initialPois,
    combinedPois,
    isMapDataLoading,
    isPoiTravelTimeLoading,
    mapError,
    poiError,
    matrixError,
  } = useMapData({ geocodedOrigins })

  // Memoize MapComponent props
  const mapComponentProps = useMemo(() => ({
    origins: geocodedOrigins,
    mainRoute,
    alternateRoute,
    midpoint: currentMidpoint,
    alternateMidpoint,
    centralMidpoint,
    pois: combinedPois,
    showPois: true,
    showAlternateRoute: !!alternateRoute,
    selectedPoiId,
    onPoiSelect: setSelectedPoiId,
    isLoading: isMapDataLoading,
  }), [
    geocodedOrigins,
    mainRoute,
    alternateRoute,
    currentMidpoint,
    alternateMidpoint,
    centralMidpoint,
    combinedPois,
    selectedPoiId,
    isMapDataLoading,
  ])

  // Memoize PointsOfInterest props
  const pointsOfInterestProps = useMemo(() => ({
    pois: combinedPois,
    origins: geocodedOrigins,
    selectedPoiId,
    onPoiSelect: setSelectedPoiId,
    isLoading: isPoiTravelTimeLoading || isMapDataLoading,
  }), [
    combinedPois,
    geocodedOrigins,
    selectedPoiId,
    isPoiTravelTimeLoading,
    isMapDataLoading,
  ])

  useEffect(() => {
    console.log('State update (ResultsMap):', {
      hasMainRoute: !!mainRoute,
      hasAlternateRoute: !!alternateRoute,
      initialPoisCount: initialPois.length,
      poisWithTimesCount: combinedPois.length,
      isMapLoading: isMapDataLoading,
      isPoiTimeLoading: isPoiTravelTimeLoading
    })
  }, [mainRoute, alternateRoute, initialPois, combinedPois, isMapDataLoading, isPoiTravelTimeLoading])

  if (!isClient) {
    return <div className="flex h-[520px] w-full items-center justify-center rounded-lg bg-gray-100"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (isMapDataLoading) {
    return <ResultsSkeleton />
  }

  if (mapError) {
    return <div className="text-destructive p-4">Error loading map data: {mapError}</div>
  }

  if (poiError || matrixError) {
    toast.error(poiError || matrixError || "Error loading POI details.")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-150px)]">
      <div className="md:col-span-2 h-full">
        <MapComponent {...mapComponentProps} />
      </div>
      <div className="h-full overflow-y-auto">
        <PointsOfInterest {...pointsOfInterestProps} />
      </div>
    </div>
  )
}
