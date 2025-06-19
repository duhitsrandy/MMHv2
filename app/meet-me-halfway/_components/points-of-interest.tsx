"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { PoiResponse, EnrichedPoi, TravelInfo } from "@/types/poi-types"
import { getRouteAction } from "@/actions/locationiq-actions"
import {
  Clock,
  MapPin,
  Coffee,
  Utensils,
  Beer,
  BookOpen,
  Navigation,
  ExternalLink,
  Film,
  Hotel,
  Music,
  Landmark,
  ArrowUpDown,
  Star,
  StarOff,
  Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { GeocodedOrigin, UserPlan } from "@/types"
import { useAnalytics } from "@/hooks/useAnalytics"
import { ANALYTICS_EVENTS } from "@/lib/analytics-events"

interface PointsOfInterestProps {
  pois: EnrichedPoi[]
  origins: GeocodedOrigin[]
  isLoading?: boolean
  selectedPoiId?: string
  onPoiSelect?: (poiId: string) => void
  plan: UserPlan | null
}

type SortOption =
  | "name"
  | "durationFromFirst"
type FilterOption = "all" | "food" | "activities" | "lodging" | "other"

export default function PointsOfInterest({
  pois,
  origins,
  isLoading = true,
  selectedPoiId,
  onPoiSelect,
  plan,
}: PointsOfInterestProps) {
  const { trackPOIInteraction, track } = useAnalytics();
  
  // Debug the full pois prop structure
  if (process.env.NODE_ENV === 'development') {
    console.log('[PointsOfInterest] Raw pois prop:', JSON.stringify(pois, null, 2));
  }

  const [activeTab, setActiveTab] = useState<FilterOption>("all")
  const [favorites, setFavorites] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("durationFromFirst")
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)

  // Load favorites from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFavorites = localStorage.getItem("mmh-favorites")
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites))
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Error loading favorites:", e)
          }
        }
      }
    }
  }, [])

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mmh-favorites", JSON.stringify(favorites))
    }
  }, [favorites])

  const sortedAndFilteredPois = useMemo(() => {
    // Start with the enriched POIs passed as props
    let processedPois = pois.map(poi => ({
      ...poi,
      // Add isFavorite status based on the local favorites state
      isFavorite: favorites.includes(poi.osm_id || `${poi.lat}-${poi.lon}`)
    }))

    // Apply category filter (tabs)
    if (activeTab !== 'all') {
      processedPois = processedPois.filter(poi => {
        const lowerType = poi.type.toLowerCase()
        switch (activeTab) {
          case 'food':
            return lowerType.includes('restaurant') || lowerType.includes('cafe') || lowerType.includes('bar') || lowerType.includes('pub') || lowerType.includes('food')
          case 'activities':
            return lowerType.includes('park') || lowerType.includes('museum') || lowerType.includes('cinema') || lowerType.includes('theatre') || lowerType.includes('theater') || lowerType.includes('entertainment') || lowerType.includes('gym') || lowerType.includes('recreation')
          case 'lodging':
            return lowerType.includes('hotel') || lowerType.includes('motel') || lowerType.includes('inn') || lowerType.includes('hostel') || lowerType.includes('lodging')
          case 'other':
            // Simplified 'other' logic - needs careful review if specific types are needed
            const knownCategories = ['restaurant', 'cafe', 'bar', 'pub', 'food', 'park', 'museum', 'cinema', 'theatre', 'theater', 'entertainment', 'gym', 'recreation', 'hotel', 'motel', 'inn', 'hostel', 'lodging']
            return !knownCategories.some(cat => lowerType.includes(cat))
          default:
            return true
        }
      })
    }

    // Filter by favorites checkbox
    if (showOnlyFavorites) {
      processedPois = processedPois.filter(poi => poi.isFavorite)
    }

    // Sorting Logic (Adaptation Needed)
    processedPois.sort((a, b) => {
       if (!a) return 1;
       if (!b) return -1;

      switch (sortBy) {
        case "name":
          return (a.name || '').localeCompare(b.name || '');
        case "durationFromFirst":
        default:
          // Explicitly check travelInfo before accessing duration
          const aDuration = (a.travelInfo && a.travelInfo.length > 0) ? a.travelInfo[0].duration ?? Infinity : Infinity;
          const bDuration = (b.travelInfo && b.travelInfo.length > 0) ? b.travelInfo[0].duration ?? Infinity : Infinity;
          return aDuration - bDuration;
      }
    });

    return processedPois
  }, [pois, activeTab, showOnlyFavorites, sortBy, favorites])

  const formatDuration = (seconds?: number | null): string => {
    if (seconds === undefined || seconds === null) {
      return "N/A"
    }
    const minutes = Math.round(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDistance = (meters?: number | null): string => {
    if (meters === undefined || meters === null) return "N/A"
    const miles = meters * 0.000621371
    if (miles >= 10) {
      return `${Math.round(miles)} mi`
    } else if (miles >= 0.1) {
      return `${Math.round(miles)} mi`
    } else {
      const feet = Math.round(miles * 5280)
      return `${feet} ft`
    }
  }

  const getPoiIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "restaurant":
        return <Utensils className="size-4" />
      case "cafe":
        return <Coffee className="size-4" />
      case "park":
        return <MapPin className="size-4" />
      case "bar":
      case "pub":
        return <Beer className="size-4" />
      case "library":
        return <BookOpen className="size-4" />
      case "cinema":
        return <Film className="size-4" />
      case "theatre":
      case "theater":
        return <Music className="size-4" />
      case "museum":
        return <Landmark className="size-4" />
      case "hotel":
        return <Hotel className="size-4" />
      default:
        return <MapPin className="size-4" />
    }
  }

  const toggleFavorite = (poiId: string) => {
    const poi = pois.find(p => (p.osm_id || `${p.lat}-${p.lon}`) === poiId);
    
    setFavorites(prev => {
      const key = poiId
      const isCurrentlyFavorited = prev.includes(key);
      
      // Track the favorite/unfavorite action
      if (poi) {
        trackPOIInteraction(
          isCurrentlyFavorited ? 'unfavorited' : 'favorited', 
          poi
        );
      }
      
      if (isCurrentlyFavorited) {
        return prev.filter(id => id !== key)
      } else {
        return [...prev, key]
      }
    })
  }

  // Add debugging for POI data
  useEffect(() => {
    if (!isLoading && sortedAndFilteredPois.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PointsOfInterest] POI data for rendering:', sortedAndFilteredPois.map(poi => ({
          name: poi.name,
          travelTimeFromStart: poi.travelInfo?.[0]?.duration,
          travelTimeFromEnd: poi.travelInfo?.[1]?.duration,
          distanceFromStart: poi.travelInfo?.[0]?.distance,
          distanceFromEnd: poi.travelInfo?.[1]?.distance,
          totalTravelTime: (poi.travelInfo?.[0]?.duration || 0) + (poi.travelInfo?.[1]?.duration || 0),
          travelTimeDifference: Math.abs((poi.travelInfo?.[0]?.duration || 0) - (poi.travelInfo?.[1]?.duration || 0))
        })));
      }
    }
  }, [sortedAndFilteredPois, isLoading])

  return (
    <Card className="relative h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Points of Interest</CardTitle>
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const newValue = !showOnlyFavorites;
              track(ANALYTICS_EVENTS.POI_FAVORITES_TOGGLED, {
                showing_favorites: newValue,
                favorites_count: favorites.length,
                total_poi_count: pois.length
              });
              setShowOnlyFavorites(newValue);
            }}
            className={`${showOnlyFavorites ? "bg-yellow-400 hover:bg-yellow-500 border-yellow-400" : ""} disabled:opacity-50`}
            title={showOnlyFavorites ? "Show all POIs" : "Show favorites only"}
            disabled={isLoading}
          >
            {showOnlyFavorites ? (
              <Star className="size-4 fill-current" />
            ) : (
              <Star className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative p-0 flex-grow flex flex-col">
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={value => {
            const newTab = value as FilterOption;
            track(ANALYTICS_EVENTS.POI_FILTER_CHANGED, {
              previous_filter: activeTab,
              new_filter: newTab,
              poi_count: pois.length
            });
            setActiveTab(newTab);
          }}
          className="flex flex-col flex-grow"
        >
          <div className="border-b px-6 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" disabled={isLoading}>All</TabsTrigger>
              <TabsTrigger value="food" disabled={isLoading}>Food</TabsTrigger>
              <TabsTrigger value="activities" disabled={isLoading}>Activities</TabsTrigger>
              <TabsTrigger value="lodging" disabled={isLoading}>Lodging</TabsTrigger>
              <TabsTrigger value="other" disabled={isLoading}>Other</TabsTrigger>
            </TabsList>
          </div>

          <div className="relative flex-grow overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-2 bg-background/80 backdrop-blur-sm">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading POIs...</p>
              </div>
            )}

            <div className="absolute inset-0 overflow-y-auto space-y-4 px-2 py-4">
              {sortedAndFilteredPois.length === 0 && !isLoading ? (
                <div className="text-muted-foreground p-4 text-center">
                  No points of interest found for the selected filters.
                </div>
              ) : (
                sortedAndFilteredPois.map(poi => {
                  const poiKey = poi.osm_id || `${poi.lat}-${poi.lon}`
                  return (
                    <Card
                      key={poiKey}
                      className={`mx-4 transition-all hover:shadow-md ${
                        selectedPoiId === poiKey ? "ring-primary ring-2" : ""
                      }`}
                      onClick={() => {
                        trackPOIInteraction('clicked', poi);
                        onPoiSelect?.(poiKey)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-center gap-2">
                              {getPoiIcon(poi.type)}
                              <span className="font-medium truncate">{poi.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-6 p-0 shrink-0"
                                onClick={e => {
                                  e.stopPropagation()
                                  toggleFavorite(poiKey)
                                }}
                              >
                                {poi.isFavorite ? (
                                  <Star className="size-4 text-yellow-500" />
                                ) : (
                                  <StarOff className="size-4" />
                                )}
                              </Button>
                            </div>

                            <CardDescription>
                              {poi.type}
                              {poi.address && (
                                <div className="text-xs text-muted-foreground mt-1 truncate" title={`${poi.address.street ? poi.address.street + ', ' : ''}${poi.address.city || ''}`}>
                                  {`${poi.address.street ? poi.address.street + ', ' : ''}${poi.address.city || ''}`}
                                  {/* Simplified address - can be expanded or made more robust */}
                                </div>
                              )}
                            </CardDescription>

                            {poi.travelInfo && poi.travelInfo.length > 0 && (
                              <div className="mt-2 text-xs">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr>
                                      <th className="pb-1 pt-1 font-medium text-muted-foreground">Origin</th>
                                      <th className="pb-1 pt-1 font-medium text-muted-foreground text-right">Time</th>
                                      <th className="pb-1 pt-1 font-medium text-muted-foreground text-right">Distance</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {poi.travelInfo.map(info => {
                                      const originName = origins[info.sourceIndex]?.display_name;
                                      const originLabel = originName 
                                        ? (originName.length > 30 ? originName.substring(0, 30) + '...' : originName)
                                        : `Loc ${info.sourceIndex + 1}`;
                                      
                                      const durationText = formatDuration(info.duration);
                                      const distanceText = formatDistance(info.distance);

                                      return (
                                        <tr key={info.sourceIndex}>
                                          <td className="py-0.5 truncate" title={originName || `Location ${info.sourceIndex + 1}`}>
                                            {originLabel}
                                          </td>
                                          <td className="py-0.5 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                              <span className="whitespace-nowrap">{durationText}</span>
                                              {plan && plan === 'pro' && info.duration !== null && (
                                                <span className="text-green-600 text-xs font-semibold leading-none" title="Travel time includes real-time traffic conditions">(Live)</span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-0.5 text-right whitespace-nowrap">{distanceText}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="size-8 shrink-0" 
                                  title="Get Directions"
                                >
                                  <Navigation className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    track(ANALYTICS_EVENTS.POI_EXTERNAL_LINK_CLICKED, {
                                      poi_id: poi.osm_id || `${poi.lat}-${poi.lon}`,
                                      poi_name: poi.name,
                                      map_service: 'google_maps'
                                    });
                                    
                                    // Google Maps: Use coordinates for precision
                                    
                                    // Debug logging in development
                                    if (process.env.NODE_ENV === 'development') {
                                      console.log('[GPS Link] Google Maps:', {
                                        poi_name: poi.name,
                                        coordinates: `${poi.lat}, ${poi.lon}`,
                                        address: poi.address
                                      });
                                    }
                                    
                                    window.open(
                                      `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lon}`,
                                      "_blank"
                                    );
                                  }}
                                >
                                  Open in Google Maps
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    track(ANALYTICS_EVENTS.POI_EXTERNAL_LINK_CLICKED, {
                                      poi_id: poi.osm_id || `${poi.lat}-${poi.lon}`,
                                      poi_name: poi.name,
                                      map_service: 'apple_maps'
                                    });
                                    
                                    // Apple Maps: Use name with location context for better recognition
                                    const poiName = poi.name || 'Location';
                                    const hasAddress = poi.address?.street && poi.address?.city;
                                    
                                    let appleMapsUrl;
                                    if (hasAddress && poi.address) {
                                      // Use name + address for better POI recognition
                                      const address = `${poi.address.street}, ${poi.address.city}`;
                                      appleMapsUrl = `http://maps.apple.com/?q=${encodeURIComponent(poiName)}&address=${encodeURIComponent(address)}`;
                                    } else {
                                      // Use name with coordinates for context
                                      appleMapsUrl = `http://maps.apple.com/?q=${encodeURIComponent(poiName)}&sll=${poi.lat},${poi.lon}&z=15`;
                                    }
                                    
                                    // Debug logging in development
                                    if (process.env.NODE_ENV === 'development') {
                                      console.log('[GPS Link] Apple Maps:', {
                                        poi_name: poi.name,
                                        url: appleMapsUrl,
                                        address: poi.address,
                                        coordinates: `${poi.lat}, ${poi.lon}`
                                      });
                                    }
                                    
                                    window.open(appleMapsUrl, "_blank");
                                  }}
                                >
                                  Open in Apple Maps
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    track(ANALYTICS_EVENTS.POI_EXTERNAL_LINK_CLICKED, {
                                      poi_id: poi.osm_id || `${poi.lat}-${poi.lon}`,
                                      poi_name: poi.name,
                                      map_service: 'waze'
                                    });
                                    
                                    // Waze: Use name + coordinates for best POI recognition
                                    const poiName = poi.name || 'Location';
                                    const address = poi.address?.street && poi.address?.city 
                                      ? `${poi.address.street}, ${poi.address.city}`
                                      : poi.address?.city || '';
                                    
                                    const searchQuery = address 
                                      ? `${poiName}, ${address}`
                                      : poiName;
                                    
                                    // Debug logging in development
                                    if (process.env.NODE_ENV === 'development') {
                                      console.log('[GPS Link] Waze:', {
                                        poi_name: poi.name,
                                        search_query: searchQuery,
                                        address: poi.address,
                                        coordinates: `${poi.lat}, ${poi.lon}`
                                      });
                                    }
                                    
                                    window.open(
                                      `https://www.waze.com/ul?q=${encodeURIComponent(searchQuery)}&ll=${poi.lat},${poi.lon}&navigate=yes`,
                                      "_blank"
                                    );
                                  }}
                                >
                                  Open in Waze
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}