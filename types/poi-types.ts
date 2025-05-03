export interface PoiResponse {
  id: string;
  osm_id: string;
  name: string;
  type: string;
  lat: string;
  lon: string;
  distance?: number;
  distanceFromStart?: number;
  distanceFromEnd?: number;
  travelTimeFromStart?: number;
  travelTimeFromEnd?: number;
  travelTimeDifference?: number;
  totalTravelTime?: number;
  isFavorite?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  tags?: Record<string, string>;
}

// Information about travel from one origin to a POI
export interface TravelInfo {
    sourceIndex: number; // Index of the origin in the geocodedOrigins array
    duration: number | null; // Travel time in seconds
    distance: number | null; // Travel distance in meters
}

// Extends PoiResponse with travel times/distances from multiple origins
export interface EnrichedPoi extends PoiResponse {
    travelInfo: TravelInfo[];
    // isFavorite?: boolean; // Keep if needed from previous version
}
