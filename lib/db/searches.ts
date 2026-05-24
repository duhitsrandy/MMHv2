import { db } from "@/db/db";
import {
  searchesTable,
  searchOriginsTable,
  SelectSearch,
  SelectSearchOrigin,
} from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { coerceCoordinate, parseCoordinate } from "./coordinates";

export type LocationEntry = {
  address: string;
  lat: number;
  lng: number;
};

export type SearchOriginRow = Pick<
  SelectSearchOrigin,
  "address" | "latitude" | "longitude" | "displayName" | "orderIndex"
>;

export type MobileSearchDto = {
  id: string;
  locations: LocationEntry[];
  createdAt: string;
};

export type MobileLocationInput = {
  address: string;
  lat: number | string;
  lng: number | string;
};

function originRowToLocationEntry(row: SearchOriginRow): LocationEntry {
  return {
    address: row.address,
    lat: parseCoordinate(row.latitude),
    lng: parseCoordinate(row.longitude),
  };
}

function isValidMetadataLocations(raw: unknown): raw is Array<{
  address: string;
  lat: number | string;
  lng: number | string;
}> {
  if (!Array.isArray(raw) || raw.length < 2) return false;
  return raw.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { address?: unknown }).address === "string" &&
      ((item as { lat?: unknown }).lat !== undefined ||
        (item as { lat?: unknown }).lat === 0) &&
      ((item as { lng?: unknown }).lng !== undefined ||
        (item as { lng?: unknown }).lng === 0)
  );
}

function metadataToLocations(metadata: unknown): LocationEntry[] {
  if (!metadata || typeof metadata !== "object") return [];
  const locations = (metadata as { locations?: unknown }).locations;
  if (!isValidMetadataLocations(locations)) return [];
  return locations.map((item) => ({
    address: item.address,
    lat: Number(item.lat),
    lng: Number(item.lng),
  }));
}

function legacyColumnsToLocations(search: SelectSearch): LocationEntry[] {
  const locations: LocationEntry[] = [];
  if (
    search.startLocationAddress &&
    search.startLocationLat &&
    search.startLocationLng
  ) {
    locations.push({
      address: search.startLocationAddress,
      lat: parseCoordinate(search.startLocationLat),
      lng: parseCoordinate(search.startLocationLng),
    });
  }
  if (
    search.endLocationAddress &&
    search.endLocationLat &&
    search.endLocationLng
  ) {
    locations.push({
      address: search.endLocationAddress,
      lat: parseCoordinate(search.endLocationLat),
      lng: parseCoordinate(search.endLocationLng),
    });
  }
  return locations;
}

export function hydrateSearchOrigins(
  search: SelectSearch,
  originRows?: SearchOriginRow[]
): LocationEntry[] {
  if (originRows && originRows.length > 0) {
    return [...originRows]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(originRowToLocationEntry);
  }

  const legacy = legacyColumnsToLocations(search);
  if (legacy.length > 0) {
    return legacy;
  }

  return metadataToLocations(search.searchMetadata);
}

export function locationsFromMobileDto(
  locations: MobileLocationInput[]
): Array<{
  address: string;
  latitude: string;
  longitude: string;
  displayName?: string;
}> {
  return locations.map((loc) => ({
    address: loc.address,
    latitude: coerceCoordinate(loc.lat),
    longitude: coerceCoordinate(loc.lng),
    displayName: loc.address,
  }));
}

export function originsToMobileLocations(
  origins: Array<{ address: string; latitude: string; longitude: string }>
): LocationEntry[] {
  return origins.map((o) => ({
    address: o.address,
    lat: parseCoordinate(o.latitude),
    lng: parseCoordinate(o.longitude),
  }));
}

/** Simple search rows for web saved-searches (no origin hydration). */
export async function listSearchRecordsForUser(
  userId: string
): Promise<SelectSearch[]> {
  return db
    .select()
    .from(searchesTable)
    .where(eq(searchesTable.userId, userId))
    .orderBy(desc(searchesTable.createdAt));
}

export async function listSearchesForUser(
  userId: string,
  options: { limit?: number } = {}
): Promise<Array<{ search: SelectSearch; locations: LocationEntry[] }>> {
  const limit = options.limit ?? 50;

  const searches = await db
    .select()
    .from(searchesTable)
    .where(eq(searchesTable.userId, userId))
    .orderBy(desc(searchesTable.createdAt))
    .limit(limit);

  if (searches.length === 0) {
    return [];
  }

  const searchIds = searches.map((s) => s.id);
  let allOrigins: Array<{
    searchId: string;
    address: string;
    latitude: string;
    longitude: string;
    displayName: string | null;
    orderIndex: number;
  }> = [];

  try {
    allOrigins = await db
      .select({
        searchId: searchOriginsTable.searchId,
        address: searchOriginsTable.address,
        latitude: searchOriginsTable.latitude,
        longitude: searchOriginsTable.longitude,
        displayName: searchOriginsTable.displayName,
        orderIndex: searchOriginsTable.orderIndex,
      })
      .from(searchOriginsTable)
      .where(inArray(searchOriginsTable.searchId, searchIds));
  } catch (error) {
    // Production may be missing search_origins migration; fall back to legacy/metadata hydration.
    console.warn(
      "[listSearchesForUser] search_origins query failed, using fallback hydration:",
      error instanceof Error ? error.message : error
    );
  }

  const originsBySearchId = new Map<string, SearchOriginRow[]>();
  for (const row of allOrigins) {
    const list = originsBySearchId.get(row.searchId) ?? [];
    list.push({
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      displayName: row.displayName,
      orderIndex: row.orderIndex,
    });
    originsBySearchId.set(row.searchId, list);
  }

  return searches.map((search) => ({
    search,
    locations: hydrateSearchOrigins(
      search,
      originsBySearchId.get(search.id)
    ),
  }));
}

export async function createSearchForUser(
  userId: string,
  locations: MobileLocationInput[],
  searchMetadata?: Record<string, unknown>
): Promise<{ search: SelectSearch; locations: LocationEntry[] }> {
  if (locations.length < 2) {
    throw new Error("At least 2 locations are required");
  }

  const origins = locationsFromMobileDto(locations);
  const locationEntries: LocationEntry[] = origins.map((o) => ({
    address: o.address,
    lat: parseCoordinate(o.latitude),
    lng: parseCoordinate(o.longitude),
  }));

  const metadata = {
    ...searchMetadata,
    locations: locationEntries,
  };

  const result = await db.transaction(async (tx) => {
    const [newSearch] = await tx
      .insert(searchesTable)
      .values({
        userId,
        originCount: locations.length,
        startLocationAddress: origins[0].address,
        startLocationLat: origins[0].latitude,
        startLocationLng: origins[0].longitude,
        endLocationAddress: origins[1].address,
        endLocationLat: origins[1].latitude,
        endLocationLng: origins[1].longitude,
        midpointLat: "0",
        midpointLng: "0",
        searchMetadata: metadata,
      })
      .returning();

    const originData = origins.map((origin, index) => ({
      searchId: newSearch.id,
      orderIndex: index,
      address: origin.address,
      latitude: origin.latitude,
      longitude: origin.longitude,
      displayName: origin.displayName ?? origin.address,
    }));

    await tx.insert(searchOriginsTable).values(originData);

    return newSearch;
  });

  return {
    search: result,
    locations: locationEntries,
  };
}

export async function deleteSearchForUser(userId: string, id: string): Promise<boolean> {
  const existing = await db
    .select({ id: searchesTable.id, userId: searchesTable.userId })
    .from(searchesTable)
    .where(eq(searchesTable.id, id))
    .limit(1);

  if (!existing[0] || existing[0].userId !== userId) {
    return false;
  }

  await db
    .delete(searchesTable)
    .where(and(eq(searchesTable.id, id), eq(searchesTable.userId, userId)));

  return true;
}
