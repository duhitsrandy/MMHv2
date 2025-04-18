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
import { PoiResponse } from "@/types/poi-types"
import { ActionState } from "@/types"
import { OsrmRoute } from "@/types/meet-me-halfway-types"

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

function useMapData({ startLat, startLng, endLat, endLng, startAddress, endAddress }: ResultsMapProps) {
  const [mainRoute, setMainRoute] = useState<OsrmRoute | null>(null)
  const [alternateRoute, setAlternateRoute] = useState<OsrmRoute | null>(null)
  const [mainRoutePois, setMainRoutePois] = useState<PoiResponse[]>([])
  const [alternateRoutePois, setAlternateRoutePois] = useState<PoiResponse[]>([])
  const [currentMidpoint, setCurrentMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [alternateMidpoint, setAlternateMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [combinedPois, setCombinedPois] = useState<PoiResponse[]>([])
  const [initialPois, setInitialPois] = useState<PoiResponse[]>([])
  const [isMapDataLoading, setIsMapDataLoading] = useState(true)
  const [isPoiTravelTimeLoading, setIsPoiTravelTimeLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [poiError, setPoiError] = useState<string | null>(null)
  const [matrixError, setMatrixError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMapData = async () => {
      setIsMapDataLoading(true)
      setIsPoiTravelTimeLoading(false)
      setRouteError(null)
      setPoiError(null)
      setMatrixError(null)

      setCombinedPois([])
      setInitialPois([])
      setMainRoute(null)
      setAlternateRoute(null)
      setCurrentMidpoint(null)
      setAlternateMidpoint(null)

      let fetchedMainRoute: OsrmRoute | null = null
      let fetchedAlternateRoute: OsrmRoute | null = null
      let mainMidpoint: { lat: number; lng: number } | null = null
      let altMidpoint: { lat: number; lng: number } | null = null

      try {
        console.log('[MapData] Fetching routes...')
        const [mainRouteRes, alternateRouteRes] = await Promise.all([
          getRouteAction({ startLat, startLon: startLng, endLat, endLon: endLng }),
          getAlternateRouteAction({ startLat, startLon: startLng, endLat, endLon: endLng })
        ])

        if (mainRouteRes.isSuccess && mainRouteRes.data) {
          fetchedMainRoute = mainRouteRes.data
          mainMidpoint = getMidpoint(fetchedMainRoute)
          setMainRoute(fetchedMainRoute)
          if (mainMidpoint) setCurrentMidpoint(mainMidpoint)
          console.log('[MapData Debug] Main Route:', fetchedMainRoute ? 'Exists' : 'null', 'Midpoint:', mainMidpoint)
        } else {
          console.error('[MapData] Failed to fetch main route:', mainRouteRes.message)
          setRouteError(mainRouteRes.message || "Failed to fetch main route.")
        }

        if (alternateRouteRes.isSuccess && alternateRouteRes.data) {
          fetchedAlternateRoute = alternateRouteRes.data
          altMidpoint = getMidpoint(fetchedAlternateRoute)
          setAlternateRoute(fetchedAlternateRoute)
          if (altMidpoint) setAlternateMidpoint(altMidpoint)
          console.log('[MapData Debug] Alternate Route:', fetchedAlternateRoute ? 'Exists' : 'null', 'Alt Midpoint:', altMidpoint)
          if (!fetchedMainRoute) {
            setRouteError(alternateRouteRes.message || "Failed to fetch alternate route.")
          }
        } else {
          console.error('[MapData] Failed to fetch alternate route:', alternateRouteRes.message)
          if (!fetchedMainRoute) {
            setRouteError(alternateRouteRes.message || "Failed to fetch alternate route.")
          }
        }

        if (fetchedMainRoute || fetchedAlternateRoute) {
          mainMidpoint = mainMidpoint || getMidpoint(fetchedAlternateRoute)
          altMidpoint = altMidpoint || getMidpoint(fetchedMainRoute)

          if (mainMidpoint || altMidpoint) {
            console.log('[MapData] Fetching initial POIs...')
            const searchPromises: Promise<ActionState<PoiResponse[]>>[] = []
            if (mainMidpoint) {
              console.log('[ResultsMap] Searching POIs around main midpoint:', mainMidpoint)
              searchPromises.push(searchPoisAction({ lat: mainMidpoint.lat.toString(), lon: mainMidpoint.lng.toString(), radius: 1500 }))
            }
            if (altMidpoint && (!mainMidpoint || (mainMidpoint.lat !== altMidpoint.lat || mainMidpoint.lng !== altMidpoint.lng))) {
              console.log('[ResultsMap] Searching POIs around alternate midpoint:', altMidpoint)
              searchPromises.push(searchPoisAction({ lat: altMidpoint.lat.toString(), lon: altMidpoint.lng.toString(), radius: 1500 }))
            }

            if (searchPromises.length === 0) {
              console.log('[MapData] No valid midpoints found to search for POIs.')
              setIsMapDataLoading(false)
              return;
            }

            const poiResults = await Promise.all(searchPromises)

            let combinedFetchedPois: PoiResponse[] = []
            let poiErrorMessage: string | null = null

            poiResults.forEach((result, index) => {
              if (result.isSuccess && result.data) {
                combinedFetchedPois.push(...result.data)
              } else {
                const source = index === 0 && mainMidpoint ? "main midpoint" : "alternate midpoint"
                console.error(`[MapData] Failed to fetch POIs for ${source}:`, result.message)
                if (!poiErrorMessage) {
                  poiErrorMessage = result.message || `Failed to fetch POIs near ${source}.`
                }
              }
            })

            if (poiErrorMessage) {
              setPoiError(poiErrorMessage)
            }

            const uniqueInitialPois = combinedFetchedPois.filter((poi, index, self) =>
              poi.lat && poi.lon && index === self.findIndex((p) => p.osm_id === poi.osm_id)
            )
            setInitialPois(uniqueInitialPois)
            console.log(`[MapData] Initial POIs fetched: ${uniqueInitialPois.length}`)
            if (uniqueInitialPois.length > 0) {
              console.log('[MapData Debug] Sample Initial POI:', uniqueInitialPois[0])
            }

            setIsMapDataLoading(false)

            if (uniqueInitialPois.length > 0) {
              setIsPoiTravelTimeLoading(true)
              console.log('[MapData] Calculating POI travel times using matrix...')

              try {
                const poiCoords = uniqueInitialPois.map(p => `${p.lon},${p.lat}`)
                const allCoordinates = [
                  `${startAddress.lng},${startAddress.lat}`,
                  `${endAddress.lng},${endAddress.lat}`,
                  ...poiCoords
                ].join(';')

                const sources = "0;1"
                const destinations = uniqueInitialPois.map((_, i) => i + 2).join(';')

                const matrixResult = await getTravelTimeMatrixAction(allCoordinates, sources, destinations)
                console.log('[MapData Debug] Matrix Result:', matrixResult)

                if (matrixResult.isSuccess && matrixResult.data) {
                  console.log('[MapData] Travel time matrix received.')
                  const { durations, distances } = matrixResult.data
                  console.log('[MapData Debug] Matrix Durations (sample):', durations?.[0]?.slice(0, 5))
                  console.log('[MapData Debug] Matrix Distances (sample):', distances?.[0]?.slice(0, 5))

                  const poisWithTravelTime = uniqueInitialPois.map((poi, index) => {
                    const matrixIndex = index
                    const travelTimeFromStart = durations?.[0]?.[matrixIndex]
                    const travelTimeFromEnd = durations?.[1]?.[matrixIndex]
                    const distanceFromStart = distances?.[0]?.[matrixIndex]
                    const distanceFromEnd = distances?.[1]?.[matrixIndex]
                    
                    const isValidTime = travelTimeFromStart != null && travelTimeFromEnd != null

                    const poiWithTimes = {
                      ...poi,
                      distanceFromStart,
                      distanceFromEnd,
                      travelTimeFromStart,
                      travelTimeFromEnd,
                      travelTimeDifference: isValidTime ? Math.abs(travelTimeFromStart - travelTimeFromEnd) : undefined,
                      totalTravelTime: isValidTime ? travelTimeFromStart + travelTimeFromEnd : undefined,
                      isFavorite: false,
                    }
                    if (index === 0) {
                      console.log('[MapData Debug] First POI processed with times:', poiWithTimes)
                    }
                    return poiWithTimes
                  })
                  setCombinedPois(poisWithTravelTime)
                  console.log('[MapData] POIs updated with travel times from matrix.')
                } else {
                  console.error('[MapData] Failed to calculate travel time matrix:', matrixResult.message)
                  const fallbackPois = uniqueInitialPois.map(p => ({...p, isFavorite: false}))
                  setCombinedPois(fallbackPois)
                  setMatrixError(matrixResult.message || "Failed to calculate travel times for POIs.")
                  if (fallbackPois.length > 0) {
                    console.log('[MapData Debug] Setting fallback POIs (sample):', fallbackPois[0])
                  }
                }
              } catch (matrixError) {
                console.error('[MapData] Error during matrix calculation process:', matrixError)
                const errorFallbackPois = uniqueInitialPois.map(p => ({...p, isFavorite: false}))
                setCombinedPois(errorFallbackPois)
                setMatrixError("An unexpected error occurred while calculating travel times.")
                if (errorFallbackPois.length > 0) {
                  console.log('[MapData Debug] Setting error fallback POIs (sample):', errorFallbackPois[0])
                }
              } finally {
                setIsPoiTravelTimeLoading(false)
              }
            } else {
              setIsPoiTravelTimeLoading(false)
            }
          } else {
            setIsMapDataLoading(false)
          }
        } else {
          setIsMapDataLoading(false)
        }
      } catch (error) {
        console.error("[MapData] Error fetching map data:", error)
        setIsMapDataLoading(false)
        setIsPoiTravelTimeLoading(false)
        if (!routeError && !poiError && !matrixError) {
          setRouteError("An unexpected error occurred while fetching map data.")
        }
      }
    }

    fetchMapData()
  }, [startLat, startLng, endLat, endLng, startAddress, endAddress])

  console.log('[MapData Debug] Returning Hook State:', {
    mainRoute: !!mainRoute,
    alternateRoute: !!alternateRoute,
    currentMidpoint: !!currentMidpoint,
    alternateMidpoint: !!alternateMidpoint,
    initialPoisCount: initialPois.length,
    combinedPoisCount: combinedPois.length,
    isMapDataLoading,
    isPoiTravelTimeLoading,
    routeError,
    poiError,
    matrixError,
  })

  return {
    mainRoute,
    alternateRoute,
    currentMidpoint,
    alternateMidpoint,
    initialPois,
    combinedPois,
    isMapDataLoading,
    isPoiTravelTimeLoading,
    routeError,
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

export default function ResultsMap({
  startLat,
  startLng,
  endLat,
  endLng,
  startAddress,
  endAddress
}: ResultsMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedPoiId, setSelectedPoiId] = useState<string | undefined>(undefined)

  const {
    mainRoute,
    alternateRoute,
    currentMidpoint,
    alternateMidpoint,
    initialPois,
    combinedPois,
    isMapDataLoading,
    isPoiTravelTimeLoading,
    routeError,
    poiError,
    matrixError,
  } = useMapData({ startLat, startLng, endLat, endLng, startAddress, endAddress })

  // Memoize MapComponent props
  const mapComponentProps = useMemo(() => ({
    startLat,
    startLng,
    endLat,
    endLng,
    startAddress: startAddress.display_name || "",
    endAddress: endAddress.display_name || "",
    midpointLat: currentMidpoint?.lat || 0,
    midpointLng: currentMidpoint?.lng || 0,
    alternateMidpointLat: alternateMidpoint?.lat || 0,
    alternateMidpointLng: alternateMidpoint?.lng || 0,
    mainRoute,
    alternateRoute,
    pois: combinedPois,
    showPois: true,
    showAlternateRoute: !!alternateRoute,
    selectedPoiId,
    onPoiSelect: setSelectedPoiId,
  }), [
    startLat,
    startLng,
    endLat,
    endLng,
    startAddress.display_name,
    endAddress.display_name,
    currentMidpoint,
    alternateMidpoint,
    mainRoute,
    alternateRoute,
    combinedPois,
    selectedPoiId,
  ])

  // Memoize PointsOfInterest props
  const pointsOfInterestProps = useMemo(() => ({
    pois: combinedPois,
    startLat,
    startLng,
    endLat,
    endLng,
    startAddress: startAddress.display_name || "",
    endAddress: endAddress.display_name || "",
    onPoiSelect: setSelectedPoiId,
    midpointLat: currentMidpoint?.lat || 0,
    midpointLng: currentMidpoint?.lng || 0,
    isLoading: isPoiTravelTimeLoading || isMapDataLoading,
  }), [
    combinedPois,
    startLat,
    startLng,
    endLat,
    endLng,
    startAddress.display_name,
    endAddress.display_name,
    currentMidpoint,
    isPoiTravelTimeLoading,
    isMapDataLoading,
  ])

  useEffect(() => {
    setIsClient(true)
  }, [])

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

  return (
    <div className="space-y-4">
      {routeError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Route Error</AlertTitle>
          <AlertDescription>{routeError}</AlertDescription>
        </Alert>
      )}
      {poiError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Points of Interest Error</AlertTitle>
          <AlertDescription>{poiError}</AlertDescription>
        </Alert>
      )}
      {matrixError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Travel Time Calculation Error</AlertTitle>
          <AlertDescription>{matrixError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <MapComponent {...mapComponentProps} />
        </div>
        <div className="md:col-span-1">
          <Card className="h-[600px] overflow-hidden">
            <PointsOfInterest {...pointsOfInterestProps} />
          </Card>
        </div>
      </div>
    </div>
  )
}
