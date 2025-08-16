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


