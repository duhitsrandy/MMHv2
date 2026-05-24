export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL as string;

function getApiBase() {
  if (!API_BASE) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is missing");
  }
  return API_BASE;
}

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchMobileRoute(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  token?: string | null
) {
  const response = await fetch(`${getApiBase()}/api/mobile/route`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      startLat: a.lat,
      startLon: a.lng,
      endLat: b.lat,
      endLon: b.lng,
    }),
  });
  if (!response.ok) {
    throw new Error(`Route API error (${response.status})`);
  }
  return response.json();
}

export async function geocodeAddress(
  address: string,
  token?: string | null
): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`${getApiBase()}/api/mobile/geocode`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ address }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (typeof data?.lat !== "number" || typeof data?.lng !== "number") return null;
  return { lat: data.lat, lng: data.lng };
}

export async function deleteAccount(token: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/api/mobile/account`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    let message = `Could not delete account (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data?.error === "string") message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}

export async function getTravelTimeMatrix(
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>,
  token?: string | null
): Promise<{ travelTimes: number[][] | null; distances: number[][] | null } | null> {
  try {
    const response = await fetch(`${getApiBase()}/api/mobile/matrix`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ origins, destinations }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    return {
      travelTimes: data.travelTimes ?? null,
      distances: data.distances ?? null,
    };
  } catch (error) {
    console.error("Travel time matrix error:", error);
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
