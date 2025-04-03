"use server"

import { db } from "@/db/db"
import { InsertLocation, SelectLocation, locationsTable } from "@/db/schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function createLocationAction(
  location: InsertLocation
): Promise<ActionState<SelectLocation>> {
  console.log("[DB Action] createLocationAction called with:", location);
  try {
    const [newLocation] = await db
      .insert(locationsTable)
      .values(location)
      .returning()
    console.log("[DB Action] createLocationAction successful:", newLocation);
    return {
      isSuccess: true,
      message: "Location created successfully",
      data: newLocation
    }
  } catch (error) {
    console.error("Error creating location:", error)
    console.error("[DB Action] createLocationAction FAILED:", error);
    return { isSuccess: false, message: "Failed to create location" }
  }
}

export async function getLocationsAction(
  userId: string
): Promise<ActionState<SelectLocation[]>> {
  try {
    const locations = await db.query.locations.findMany({
      where: eq(locationsTable.userId, userId),
      orderBy: (locations) => [locations.createdAt]
    })
    return {
      isSuccess: true,
      message: "Locations retrieved successfully",
      data: locations
    }
  } catch (error) {
    console.error("Error getting locations:", error)
    return { isSuccess: false, message: "Failed to get locations" }
  }
}

export async function getLocationAction(
  id: string
): Promise<ActionState<SelectLocation>> {
  try {
    const location = await db.query.locations.findFirst({
      where: eq(locationsTable.id, id)
    })

    if (!location) {
      return { isSuccess: false, message: "Location not found" }
    }

    return {
      isSuccess: true,
      message: "Location retrieved successfully",
      data: location
    }
  } catch (error) {
    console.error("Error getting location:", error)
    return { isSuccess: false, message: "Failed to get location" }
  }
}

export async function updateLocationAction(
  id: string,
  data: Partial<InsertLocation>
): Promise<ActionState<SelectLocation>> {
  try {
    const [updatedLocation] = await db
      .update(locationsTable)
      .set(data)
      .where(eq(locationsTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Location updated successfully",
      data: updatedLocation
    }
  } catch (error) {
    console.error("Error updating location:", error)
    return { isSuccess: false, message: "Failed to update location" }
  }
}

export async function deleteLocationAction(
  id: string
): Promise<ActionState<void>> {
  console.log(`[DB Action] deleteLocationAction called for ID: ${id}`);
  try {
    await db.delete(locationsTable).where(eq(locationsTable.id, id))
    console.log(`[DB Action] deleteLocationAction successful for ID: ${id}`);
    return {
      isSuccess: true,
      message: "Location deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting location:", error)
    console.error(`[DB Action] deleteLocationAction FAILED for ID: ${id}:`, error);
    return { isSuccess: false, message: "Failed to delete location" }
  }
} 