"use server"

import { db } from "@/db/db"
import { InsertLocation, SelectLocation, locationsTable } from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server";
import {
  createLocationForUser,
  deleteLocationForUser,
  listLocationsForUser,
} from "@/lib/db/locations";

export async function createLocationAction(
  locationData: Omit<InsertLocation, 'userId' | 'id' | 'createdAt'>
): Promise<ActionState<SelectLocation>> {
  console.log("[DB Action] createLocationAction called with:", locationData);
  const { userId } = auth();
  if (!userId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const newLocation = await createLocationForUser(userId, {
      name: locationData.name,
      address: locationData.address,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });
    console.log("[DB Action] createLocationAction successful:", newLocation);
    return {
      isSuccess: true,
      message: "Location created successfully",
      data: newLocation
    }
  } catch (error) {
    console.error("Error creating location:", error)
    return { isSuccess: false, message: "An internal error occurred while creating the location." }
  }
}

export async function getLocationsAction(
  targetUserId: string
): Promise<ActionState<SelectLocation[]>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }
  if (authenticatedUserId !== targetUserId) {
    return { isSuccess: false, message: "Error: Unauthorized to access these locations." };
  }

  try {
    const locations = await listLocationsForUser(targetUserId);
    return {
      isSuccess: true,
      message: "Locations retrieved successfully",
      data: locations
    }
  } catch (error) {
    console.error("Error getting locations:", error)
    const detail = error instanceof Error ? error.message : String(error)
    console.error("Error getting locations detail:", detail)
    return { isSuccess: false, message: "An internal error occurred while retrieving locations." }
  }
}

export async function getLocationAction(
  id: string
): Promise<ActionState<SelectLocation>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const location = await db.query.locations.findFirst({
      where: eq(locationsTable.id, id)
    })

    if (!location) {
      return { isSuccess: false, message: "Location not found" }
    }

    if (location.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to access this location." };
    }

    return {
      isSuccess: true,
      message: "Location retrieved successfully",
      data: location
    }
  } catch (error) {
    console.error("Error getting location:", error)
    return { isSuccess: false, message: "An internal error occurred while retrieving the location." }
  }
}

export async function updateLocationAction(
  id: string,
  data: Partial<Omit<InsertLocation, 'userId' | 'id' | 'createdAt'>>
): Promise<ActionState<SelectLocation>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const existingLocation = await db.query.locations.findFirst({
      where: eq(locationsTable.id, id)
    });

    if (!existingLocation) {
       return { isSuccess: false, message: "Location not found to update." };
    }

    if (existingLocation.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to update this location." };
    }

    const [updatedLocation] = await db
      .update(locationsTable)
      .set(data)
      .where(eq(locationsTable.id, id))
      .returning()

    if (!updatedLocation) {
      console.error(`[DB Action] Update failed unexpectedly after authorization for ID: ${id}`);
      return { isSuccess: false, message: "Failed to update location after authorization." };
    }

    return {
      isSuccess: true,
      message: "Location updated successfully",
      data: updatedLocation
    }
  } catch (error) {
    console.error("Error updating location:", error)
    return { isSuccess: false, message: "An internal error occurred while updating the location." }
  }
}

export async function deleteLocationAction(
  id: string
): Promise<ActionState<void>> {
  console.log(`[DB Action] deleteLocationAction called for ID: ${id}`);
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const deleted = await deleteLocationForUser(authenticatedUserId, id);
    if (!deleted) {
      return { isSuccess: false, message: "Location not found to delete." };
    }
    console.log(`[DB Action] deleteLocationAction successful for ID: ${id}`);
    return {
      isSuccess: true,
      message: "Location deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting location:", error)
    return { isSuccess: false, message: "An internal error occurred while deleting the location." }
  }
} 