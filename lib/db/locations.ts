import { db } from "@/db/db";
import { locationsTable, SelectLocation } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { coerceCoordinate, parseCoordinate } from "./coordinates";

export type MobileLocationDto = {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
};

export type MobileLocationInput = {
  label: string;
  address: string;
  lat: number | string;
  lng: number | string;
};

export function locationToMobileDto(row: SelectLocation): MobileLocationDto {
  return {
    id: row.id,
    label: row.name,
    address: row.address,
    lat: parseCoordinate(row.latitude),
    lng: parseCoordinate(row.longitude),
    createdAt: row.createdAt.toISOString(),
  };
}

export function locationFromMobileDto(dto: MobileLocationInput): {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
} {
  return {
    name: dto.label.trim(),
    address: dto.address.trim(),
    latitude: coerceCoordinate(dto.lat),
    longitude: coerceCoordinate(dto.lng),
  };
}

export async function listLocationsForUser(userId: string): Promise<SelectLocation[]> {
  return db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.userId, userId))
    .orderBy(locationsTable.createdAt);
}

export async function createLocationForUser(
  userId: string,
  input: { name: string; address: string; latitude: string; longitude: string }
): Promise<SelectLocation> {
  const [created] = await db
    .insert(locationsTable)
    .values({ userId, ...input })
    .returning();
  return created;
}

export async function deleteLocationForUser(userId: string, id: string): Promise<boolean> {
  const existing = await db
    .select({ id: locationsTable.id, userId: locationsTable.userId })
    .from(locationsTable)
    .where(eq(locationsTable.id, id))
    .limit(1);

  if (!existing[0] || existing[0].userId !== userId) {
    return false;
  }

  await db
    .delete(locationsTable)
    .where(and(eq(locationsTable.id, id), eq(locationsTable.userId, userId)));

  return true;
}
