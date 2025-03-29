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
