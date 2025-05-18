"use server";

import { eq, desc, and } from "drizzle-orm";
import { locationsTable, InsertLocation } from "@/db/schema";
import { db } from "@/db/db";
import { ActionState } from "@/types";

export async function getLocationsAction(userId: string): Promise<ActionState<typeof locationsTable.$inferSelect[]>> {
  if (!userId) {
    return { isSuccess: false, message: "User not authenticated." };
  }
  try {
    const locations = await db
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.userId, userId))
      .orderBy(desc(locationsTable.createdAt));

    return { isSuccess: true, message: "Locations retrieved successfully.", data: locations };
  } catch (error: any) {
    console.error("[getLocationsAction] Full error:", error);
    console.error("[getLocationsAction] Error name:", error.name);
    console.error("[getLocationsAction] Error message:", error.message);
    return {
      isSuccess: false,
      message: "An internal error occurred while retrieving locations."
    };
  }
}

export async function createLocationAction(locationData: InsertLocation): Promise<ActionState<typeof locationsTable.$inferSelect>> {
  if (!locationData.userId) {
    return { isSuccess: false, message: "User ID is missing in location data." };
  }
  try {
    const newLocation = await db
      .insert(locationsTable)
      .values(locationData)
      .returning();

    if (newLocation.length === 0) {
        console.error("[createLocationAction] Failed to create location, no data returned.");
        return { isSuccess: false, message: "Failed to create location." };
    }
    console.log("[createLocationAction] Location created successfully:", newLocation[0]);
    return { isSuccess: true, message: "Location created successfully.", data: newLocation[0] };
  } catch (error: any) {
    console.error("[createLocationAction] Full error creating location:", error);
    console.error("[createLocationAction] Error name:", error.name);
    console.error("[createLocationAction] Error message:", error.message);
    return {
      isSuccess: false,
      message: "An internal error occurred while creating the location."
    };
  }
}

type UpdateLocationData = Partial<Omit<InsertLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { updatedAt?: Date }>;

export async function updateLocationAction(
  userId: string, 
  locationId: string, 
  locationUpdateData: UpdateLocationData
): Promise<ActionState<typeof locationsTable.$inferSelect>> {
  if (!userId) {
    return { isSuccess: false, message: "User not authenticated." };
  }
  try {
    const updatedLocation = await db
      .update(locationsTable)
      .set({...locationUpdateData, updatedAt: new Date() })
      .where(and(eq(locationsTable.id, locationId), eq(locationsTable.userId, userId)))
      .returning();
    
    if (updatedLocation.length === 0) {
        console.warn("[updateLocationAction] Location not found or user mismatch for update:", { userId, locationId });
        return { isSuccess: false, message: "Failed to update location. Not found or permission denied." };
    }
    console.log("[updateLocationAction] Location updated successfully:", updatedLocation[0]);
    return { isSuccess: true, message: "Location updated successfully.", data: updatedLocation[0] };
  } catch (error: any) {
    console.error("[updateLocationAction] Full error updating location:", error);
    console.error("[updateLocationAction] Error name:", error.name);
    console.error("[updateLocationAction] Error message:", error.message);
    return {
      isSuccess: false,
      message: "An internal error occurred while updating the location."
    };
  }
}

export async function deleteLocationAction(userId: string, locationId: string): Promise<ActionState<null>> {
  if (!userId) {
    return { isSuccess: false, message: "User not authenticated." };
  }
  try {
    const result = await db.delete(locationsTable).where(and(eq(locationsTable.id, locationId), eq(locationsTable.userId, userId))).returning({ id: locationsTable.id });
    if (result.length === 0) {
        console.warn("[deleteLocationAction] Location not found or user mismatch for delete:", { userId, locationId });
        return { isSuccess: false, message: "Failed to delete location. Not found or permission denied." };
    }
    return { isSuccess: true, message: "Location deleted successfully.", data: null };
  } catch (error: any) {
    console.error("[deleteLocationAction] Full error deleting location:", error);
    console.error("[deleteLocationAction] Error name:", error.name);
    console.error("[deleteLocationAction] Error message:", error.message);
    return {
      isSuccess: false,
      message: "An internal error occurred while deleting the location."
    };
  }
} 