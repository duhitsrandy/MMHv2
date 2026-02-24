import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedLocation = {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
};

export type SavedSearch = {
  id: string;
  locations: Array<{ address: string; lat: number; lng: number }>;
  createdAt: string;
};

const KEYS = {
  locations: "mmh_saved_locations_v1",
  searches: "mmh_saved_searches_v1",
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getSavedLocations() {
  return readJson<SavedLocation[]>(KEYS.locations, []);
}

export async function saveLocation(input: Omit<SavedLocation, "id" | "createdAt">) {
  const locations = await getSavedLocations();
  const existing = locations.find(
    (item) =>
      item.address.trim().toLowerCase() === input.address.trim().toLowerCase() ||
      (Math.abs(item.lat - input.lat) < 0.0001 && Math.abs(item.lng - input.lng) < 0.0001)
  );
  if (existing) return existing;
  const next: SavedLocation = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await writeJson(KEYS.locations, [next, ...locations].slice(0, 100));
  return next;
}

export async function removeSavedLocation(id: string) {
  const locations = await getSavedLocations();
  await writeJson(
    KEYS.locations,
    locations.filter((item) => item.id !== id)
  );
}

export async function getSavedSearches() {
  return readJson<SavedSearch[]>(KEYS.searches, []);
}

export async function saveSearch(locations: SavedSearch["locations"]) {
  const searches = await getSavedSearches();
  const next: SavedSearch = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    locations,
    createdAt: new Date().toISOString(),
  };
  await writeJson(KEYS.searches, [next, ...searches].slice(0, 50));
  return next;
}

export async function removeSavedSearch(id: string) {
  const searches = await getSavedSearches();
  await writeJson(
    KEYS.searches,
    searches.filter((item) => item.id !== id)
  );
}

