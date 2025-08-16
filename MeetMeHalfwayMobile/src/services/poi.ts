type Poi = {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  type?: string;
};

export async function getNearbyPois(
  lat: number,
  lng: number,
  radiusMeters = 1200,
  tags: string[] = ['restaurant', 'cafe', 'park']
): Promise<Poi[]> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL as string;
  const url = `${apiBase}/api/pois/search?lat=${lat}&lng=${lng}&radius=${radiusMeters}&tags=${encodeURIComponent(
    tags.join(',')
  )}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.pois as Poi[]) || [];
}


