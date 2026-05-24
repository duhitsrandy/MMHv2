import { API_BASE } from "./api";
import type { SavedLocation, SavedSearch } from "./storage";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function mobileFetch<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${path}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Locations ────────────────────────────────────────────────────────────────

export async function fetchCloudLocations(token: string): Promise<SavedLocation[]> {
  const data = await mobileFetch<
    Array<{ id: string; label: string; address: string; lat: number; lng: number; createdAt: string }>
  >(token, "/api/mobile/saved/locations");
  return data.map((item) => ({
    id: item.id,
    label: item.label,
    address: item.address,
    lat: item.lat,
    lng: item.lng,
    createdAt: item.createdAt,
  }));
}

export async function createCloudLocation(
  token: string,
  data: Omit<SavedLocation, "id" | "createdAt">
): Promise<SavedLocation> {
  const item = await mobileFetch<{
    id: string;
    label: string;
    address: string;
    lat: number;
    lng: number;
    createdAt: string;
  }>(token, "/api/mobile/saved/locations", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return {
    id: item.id,
    label: item.label,
    address: item.address,
    lat: item.lat,
    lng: item.lng,
    createdAt: item.createdAt,
  };
}

export async function deleteCloudLocation(token: string, id: string): Promise<void> {
  await mobileFetch(token, `/api/mobile/saved/locations?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ─── Searches ─────────────────────────────────────────────────────────────────

export async function fetchCloudSearches(token: string): Promise<SavedSearch[]> {
  const data = await mobileFetch<
    Array<{
      id: string;
      locations: Array<{ address: string; lat: number; lng: number }>;
      createdAt: string;
    }>
  >(token, "/api/mobile/saved/searches");
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
  const item = await mobileFetch<{
    id: string;
    locations: SavedSearch["locations"];
    createdAt: string;
  }>(token, "/api/mobile/saved/searches", {
    method: "POST",
    body: JSON.stringify({ locations }),
  });
  return { id: item.id, locations: item.locations, createdAt: item.createdAt };
}

export async function deleteCloudSearch(token: string, id: string): Promise<void> {
  await mobileFetch(token, `/api/mobile/saved/searches?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
