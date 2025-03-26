export interface PoiResponse {
  osm_id?: string
  id?: string
  name: string
  type: string
  lat: string
  lon: string
  address: {
    road?: string
    house_number?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
  }
  selectedRoute?: 'main' | 'alternate'
  travelTimeFromStart?: number
  travelTimeFromEnd?: number
  distanceFromStart?: number
  distanceFromEnd?: number
  totalTravelTime?: number
  travelTimeDifference?: number
  isFavorite?: boolean
}
