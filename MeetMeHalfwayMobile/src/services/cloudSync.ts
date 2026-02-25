import { API_BASE } from "./api";
import type { SavedLocation, SavedSearch } from "./storage";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ─── Locations ────────────────────────────────────────────────────────────────

export async function fetchCloudLocations(token: string): Promise<SavedLocation[]> {
  const res = await fetch(`${API_BASE}/api/mobile/saved/locations`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`fetchCloudLocations: ${res.status}`);
  const data: Array<{ id: string; label: string; address: string; lat: string; lng: string; createdAt: string }> =
    await res.json();
  return data.map((item) => ({
    id: item.id,
    label: item.label,
    address: item.address,
    lat: Number(item.lat),
    lng: Number(item.lng),
    createdAt: item.createdAt,
  }));
}

export async function createCloudLocation(
  token: string,
  data: Omit<SavedLocation, "id" | "createdAt">
): Promise<SavedLocation> {
  const res = await fetch(`${API_BASE}/api/mobile/saved/locations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`createCloudLocation: ${res.status}`);
  const item = await res.json();
  return {
    id: item.id,
    label: item.label,
    address: item.address,
    lat: Number(item.lat),
    lng: Number(item.lng),
    createdAt: item.createdAt,
  };
}

export async function deleteCloudLocation(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/mobile/saved/locations?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`deleteCloudLocation: ${res.status}`);
}

// ─── Searches ─────────────────────────────────────────────────────────────────

export async function fetchCloudSearches(token: string): Promise<SavedSearch[]> {
  const res = await fetch(`${API_BASE}/api/mobile/saved/searches`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`fetchCloudSearches: ${res.status}`);
  const data: Array<{
    id: string;
    locations: Array<{ address: string; lat: number; lng: number }>;
    createdAt: string;
  }> = await res.json();
  return data.map((item) => ({
    id: item.id,
    locations: item.locations,
    createdAt: item.createdAt,
  }));
}

export async function createCloudSearch(
  token: string,
  locations: SavedSearch["locations"]
): Promise<SavedSearch> {
  const res = await fetch(`${API_BASE}/api/mobile/saved/searches`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ locations }),
  });
  if (!res.ok) throw new Error(`createCloudSearch: ${res.status}`);
  const item = await res.json();
  return { id: item.id, locations: item.locations, createdAt: item.createdAt };
}

export async function deleteCloudSearch(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/mobile/saved/searches?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`deleteCloudSearch: ${res.status}`);
}
