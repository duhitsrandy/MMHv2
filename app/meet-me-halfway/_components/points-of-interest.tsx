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
import { PoiResponse } from "@/types/poi-types"
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
  StarOff
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface PointsOfInterestProps {
  pois: PoiResponse[]
  startLat: string | number
  startLng: string | number
  endLat: string | number
  endLng: string | number
  startAddress?: string
  endAddress?: string
  onPoiSelect?: (poiId: string) => void
  midpointLat?: string | number
  midpointLng?: string | number
}

interface PoiWithTravelTimes extends PoiResponse {
  osm_id: string
  travelTimeFromStart?: number
  travelTimeFromEnd?: number
  distanceFromStart?: number
  distanceFromEnd?: number
  totalTravelTime?: number
  travelTimeDifference?: number
  isFavorite?: boolean
}

type SortOption =
  | "name"
  | "distanceFromStart"
  | "distanceFromEnd"
  | "totalTime"
  | "timeDifference"
type FilterOption = "all" | "food" | "activities" | "lodging" | "other"
type MaxTimeDifference = 5 | 10 | 15 | 30 | 999

export default function PointsOfInterest({
  pois,
  startLat,
  startLng,
  endLat,
  endLng,
  startAddress = "",
  endAddress = "",
  onPoiSelect,
  midpointLat = "0",
  midpointLng = "0"
}: PointsOfInterestProps) {
  // Debug the full pois prop structure
  console.log('[PointsOfInterest] Raw pois prop:', JSON.stringify(pois, null, 2));

  const [poisWithTravelTimes, setPoisWithTravelTimes] = useState<
    PoiWithTravelTimes[]
  >([])
  const [activeTab, setActiveTab] = useState<FilterOption>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPoi, setSelectedPoi] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("totalTime")
  const [maxTimeDifference, setMaxTimeDifference] =
    useState<MaxTimeDifference>(15)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  // Load favorites from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFavorites = localStorage.getItem("mmh-favorites")
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites))
        } catch (e) {
          console.error("Error loading favorites:", e)
        }
      }
    }
  }, [])

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined" && favorites.length > 0) {
      localStorage.setItem("mmh-favorites", JSON.stringify(favorites))
    }
  }, [favorites])

  // Combined effect to handle POI updates and travel time calculations
  useEffect(() => {
    if (!pois.length) {
      console.log('[PointsOfInterest] No POIs provided');
      setIsLoading(false)
      setPoisWithTravelTimes([])
      return
    }

    setIsLoading(true)
    setPoisWithTravelTimes([]) // Reset before loading new ones

    try {
      console.log('[PointsOfInterest] Processing POIs:', pois);
      // Use the pre-calculated travel times from the POIs
      const updatedPois = pois.map(poi => {
        const poiId = poi.osm_id || `${poi.lat}-${poi.lon}`;
        console.log('[PointsOfInterest] Processing POI:', {
          name: poi.name,
          id: poiId,
          travelTimeFromStart: poi.travelTimeFromStart,
          travelTimeFromEnd: poi.travelTimeFromEnd,
          totalTravelTime: poi.totalTravelTime,
          distanceFromStart: poi.distanceFromStart,
          distanceFromEnd: poi.distanceFromEnd
        });

        // Ensure all required fields are present
        const updatedPoi = {
          ...poi,
          osm_id: poiId,
          isFavorite: favorites.includes(poiId),
          travelTimeFromStart: poi.travelTimeFromStart || undefined,
          travelTimeFromEnd: poi.travelTimeFromEnd || undefined,
          distanceFromStart: poi.distanceFromStart || undefined,
          distanceFromEnd: poi.distanceFromEnd || undefined,
          totalTravelTime: poi.totalTravelTime || undefined,
          travelTimeDifference: poi.travelTimeDifference || undefined
        };

        console.log('[PointsOfInterest] Updated POI:', updatedPoi);
        return updatedPoi;
      });

      console.log('[PointsOfInterest] Updated POIs:', updatedPois);
      setPoisWithTravelTimes(updatedPois);
    } catch (error) {
      console.error("[PointsOfInterest] Error processing POIs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pois, favorites]);

  // Define getPoiCategory before using it
  const getPoiCategory = (type: string): string => {
    if (type.includes('restaurant') || type.includes('cafe') || type.includes('bar')) return 'Food & Drink';
    if (type.includes('park') || type.includes('playground') || type.includes('recreation')) return 'Parks & Recreation';
    if (type.includes('hotel') || type.includes('motel') || type.includes('inn')) return 'Hotels';
    if (type.includes('shop') || type.includes('store') || type.includes('market')) return 'Shopping';
    if (type.includes('museum') || type.includes('gallery') || type.includes('theatre')) return 'Arts & Culture';
    if (type.includes('school') || type.includes('university') || type.includes('college')) return 'Education';
    if (type.includes('hospital') || type.includes('clinic') || type.includes('pharmacy')) return 'Healthcare';
    if (type.includes('bank') || type.includes('atm') || type.includes('post')) return 'Services';
    return 'Other';
  };

  const sortedAndFilteredPois = useMemo(() => {
    console.log('[PointsOfInterest] Sorting and filtering POIs with travel times:', poisWithTravelTimes);
    
    // Apply category filter (from tabs)
    let filtered = [...poisWithTravelTimes];
    
    // Filter by tabs
    if (activeTab !== 'all') {
      filtered = filtered.filter(poi => {
        const lowerType = poi.type.toLowerCase();
        switch (activeTab) {
          case 'food':
            return lowerType.includes('restaurant') || 
                   lowerType.includes('cafe') || 
                   lowerType.includes('bar') || 
                   lowerType.includes('pub') ||
                   lowerType.includes('food');
          case 'activities':
            return lowerType.includes('park') || 
                   lowerType.includes('museum') || 
                   lowerType.includes('cinema') || 
                   lowerType.includes('theatre') ||
                   lowerType.includes('theater') || 
                   lowerType.includes('entertainment') ||
                   lowerType.includes('gym') ||
                   lowerType.includes('recreation');
          case 'lodging':
            return lowerType.includes('hotel') || 
                   lowerType.includes('motel') || 
                   lowerType.includes('inn') || 
                   lowerType.includes('hostel') ||
                   lowerType.includes('lodging');
          case 'other':
            return !lowerType.includes('restaurant') && 
                   !lowerType.includes('cafe') && 
                   !lowerType.includes('bar') && 
                   !lowerType.includes('pub') &&
                   !lowerType.includes('food') &&
                   !lowerType.includes('park') && 
                   !lowerType.includes('museum') && 
                   !lowerType.includes('cinema') && 
                   !lowerType.includes('theatre') &&
                   !lowerType.includes('theater') && 
                   !lowerType.includes('entertainment') &&
                   !lowerType.includes('gym') &&
                   !lowerType.includes('recreation') &&
                   !lowerType.includes('hotel') && 
                   !lowerType.includes('motel') && 
                   !lowerType.includes('inn') && 
                   !lowerType.includes('hostel') &&
                   !lowerType.includes('lodging');
          default:
            return true;
        }
      });
    }
    
    // Filter by favorites
    if (showOnlyFavorites) {
      filtered = filtered.filter(poi => poi.isFavorite);
    }
    
    console.log('[PointsOfInterest] Filtered POIs:', filtered);
    
    // Sort by total travel time
    const sorted = filtered.sort((a, b) => {
      const aTime = a.totalTravelTime || Infinity;
      const bTime = b.totalTravelTime || Infinity;
      return aTime - bTime;
    });
    
    console.log('[PointsOfInterest] Sorted POIs:', sorted);
    return sorted;
  }, [poisWithTravelTimes, activeTab, showOnlyFavorites]);

  // Get unique categories for the filter
  const categories = useMemo(() => {
    return Array.from(new Set(poisWithTravelTimes.map(poi => getPoiCategory(poi.type)))).sort();
  }, [poisWithTravelTimes]);

  const formatDuration = (seconds?: number): string => {
    console.log('[formatDuration] Input seconds:', seconds);
    if (seconds === undefined || seconds === null) {
      console.log('[formatDuration] Returning N/A for undefined seconds');
      return "N/A";
    }

    // Convert seconds to minutes and round to nearest minute
    const minutes = Math.round(seconds / 60);
    console.log('[formatDuration] Converted to minutes:', minutes);

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    console.log('[formatDuration] Calculated hours:', hours, 'mins:', mins);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }

    return `${mins}m`;
  }

  const formatDistance = (meters?: number): string => {
    if (meters === undefined) return "N/A"

    // Convert meters to miles (1 meter = 0.000621371 miles)
    const miles = meters * 0.000621371

    if (miles >= 10) {
      // For longer distances, round to nearest mile
      return `${Math.round(miles)} mi`
    } else if (miles >= 0.1) {
      // For medium distances, round to nearest mile
      return `${Math.round(miles)} mi`
    } else {
      // For very short distances, show in feet (1 mile = 5280 feet)
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
        return <Beer className="size-4" />
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
    setFavorites(prev => {
      if (prev.includes(poiId)) {
        return prev.filter(id => id !== poiId)
      } else {
        return [...prev, poiId]
      }
    })
  }

  // Add debugging for POI data
  useEffect(() => {
    if (sortedAndFilteredPois.length > 0) {
      console.log('[PointsOfInterest] POI data for rendering:', sortedAndFilteredPois.map(poi => ({
        name: poi.name,
        travelTimeFromStart: poi.travelTimeFromStart,
        travelTimeFromEnd: poi.travelTimeFromEnd,
        distanceFromStart: poi.distanceFromStart,
        distanceFromEnd: poi.distanceFromEnd,
        totalTravelTime: poi.totalTravelTime,
        travelTimeDifference: poi.travelTimeDifference
      })));
    }
  }, [sortedAndFilteredPois]);

  return (
    <Card className="h-[600px] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Points of Interest</CardTitle>
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={showOnlyFavorites ? "bg-yellow-400 hover:bg-yellow-500 border-yellow-400" : ""}
            title={showOnlyFavorites ? "Show all POIs" : "Show favorites only"}
          >
            {showOnlyFavorites ? (
              <Star className="size-4 fill-current" />
            ) : (
              <Star className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={value => setActiveTab(value as FilterOption)}
        >
          <div className="border-b px-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="food">Food</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="lodging">Lodging</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </div>

          <div className="h-[485px] space-y-4 overflow-y-auto px-2 py-4">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="mx-4">
                    <CardContent className="p-4">
                      <Skeleton className="mb-2 h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
            ) : sortedAndFilteredPois.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center">
                No points of interest found for the selected filters.
              </div>
            ) : (
              sortedAndFilteredPois.map(poi => (
                <Card
                  key={poi.osm_id || `${poi.lat}-${poi.lon}`}
                  className={`mx-4 transition-all hover:shadow-md ${
                    selectedPoi === (poi.osm_id || `${poi.lat}-${poi.lon}`) ? "ring-primary ring-2" : ""
                  }`}
                  onClick={() => {
                    setSelectedPoi(poi.osm_id || `${poi.lat}-${poi.lon}` || null)
                    onPoiSelect?.(poi.osm_id || `${poi.lat}-${poi.lon}` || "")
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
                              if (poi.osm_id) toggleFavorite(poi.osm_id)
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
                            <div className="text-xs text-muted-foreground mt-1">
                              {[
                                poi.address.street,
                                poi.address.city,
                                poi.address.state,
                                poi.address.postal_code
                              ].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </CardDescription>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Clock className="size-3 shrink-0" />
                            <span className="truncate text-xs">
                              Location 1: {" "}
                              {typeof poi.travelTimeFromStart === 'number' 
                                ? formatDuration(poi.travelTimeFromStart)
                                : "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Clock className="size-3 shrink-0" />
                            <span className="truncate text-xs">
                              Location 2: {" "}
                              {typeof poi.travelTimeFromEnd === 'number'
                                ? formatDuration(poi.travelTimeFromEnd)
                                : "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Navigation className="size-3 shrink-0" />
                            <span className="truncate text-xs">
                              Location 1: {typeof poi.distanceFromStart === 'number'
                                ? formatDistance(poi.distanceFromStart)
                                : "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Navigation className="size-3 shrink-0" />
                            <span className="truncate text-xs">
                              Location 2: {typeof poi.distanceFromEnd === 'number'
                                ? formatDistance(poi.distanceFromEnd)
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {typeof poi.travelTimeDifference === 'number' && (
                          <div className="mt-2">
                            <Badge
                              variant={
                                poi.travelTimeDifference / 60 <= 5
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {Math.round(poi.travelTimeDifference / 60)} min
                              difference
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="size-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPoiSelect?.(poi.osm_id || `${poi.lat}-${poi.lon}` || "");
                          }}
                          title="View on Map"
                        >
                          <MapPin className="size-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="shrink-0">
                              <Navigation className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
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
                                window.open(
                                  `http://maps.apple.com/?ll=${poi.lat},${poi.lon}`,
                                  "_blank"
                                );
                              }}
                            >
                              Open in Apple Maps
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  `https://www.waze.com/ul?ll=${poi.lat},${poi.lon}&navigate=yes`,
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
              ))
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}