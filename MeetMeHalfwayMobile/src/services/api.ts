export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL as string;

export async function findMidpoint(origins: Array<{ lat: number; lng: number }>) {
  const response = await fetch(`${API_BASE}/api/meet-me-halfway/find-midpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origins }),
  });
  if (!response.ok) throw new Error('Network error');
  return response.json();
}

export async function searchPOIs(lat: number, lng: number, radius: number) {
  const response = await fetch(`${API_BASE}/api/pois/search?lat=${lat}&lng=${lng}&radius=${radius}`);
  if (!response.ok) throw new Error('Network error');
  return response.json();
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`${API_BASE}/api/ors/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  // ORS geocode search returns features with geometry.coordinates [lon, lat]
  const feature = data?.features?.[0];
  if (!feature?.geometry?.coordinates?.length) return null;
  const [lng, lat] = feature.geometry.coordinates;
  return { lat, lng };
}

export async function getTravelTimeMatrix(
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>
): Promise<{ travelTimes: number[][] | null; distances: number[][] | null } | null> {
  try {
    // Format coordinates for ORS Matrix API: "lon,lat;lon,lat;..."
    const allCoords = [...origins, ...destinations];
    const coordinates = allCoords.map(coord => `${coord.lng},${coord.lat}`).join(';');
    
    // Sources are the first N coordinates (origins)
    const sources = origins.map((_, idx) => idx).join(';');
    
    // Destinations are the last M coordinates 
    const destinations_indices = destinations.map((_, idx) => origins.length + idx).join(';');
    
    const response = await fetch(`${API_BASE}/api/ors/matrix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates,
        sources,
        destinations: destinations_indices,
      }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    
    return {
      travelTimes: data.durations || null,
      distances: data.distances || null,
    };
  } catch (error) {
    console.error('Travel time matrix error:', error);
    return null;
  }
}

// Simple haversine distance calculation for fallback
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


