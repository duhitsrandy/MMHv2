"use server"

import { db } from "@/db/db"
import { InsertPoi, SelectPoi, poisTable } from "@/db/schema"
import { searchesTable } from "@/db/schema/searches-schema"
import { ActionState } from "@/types"
import { and, eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server";

export async function createPoiAction(
  poi: InsertPoi
): Promise<ActionState<SelectPoi>> {
  const { userId: authenticatedUserId } = await auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    // Authorization: Check if the user owns the associated search
    const search = await db.query.searches.findFirst({
      where: eq(searchesTable.id, poi.searchId)
    });

    if (!search) {
      return { isSuccess: false, message: "Error: Associated search not found." };
    }
    if (search.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to add POI to this search." };
    }

    // Proceed with creation if authorized
    const [newPoi] = await db.insert(poisTable).values(poi).returning()
    return {
      isSuccess: true,
      message: "POI created successfully",
      data: newPoi
    }
  } catch (error) {
    console.error("Error creating POI:", error)
    return { isSuccess: false, message: "An internal error occurred while creating the POI." }
  }
}

export async function getPoisBySearchAction(
  searchId: string
): Promise<ActionState<SelectPoi[]>> {
  const { userId: authenticatedUserId } = await auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    // Authorization: Check if the user owns the associated search
    const search = await db.query.searches.findFirst({
      where: eq(searchesTable.id, searchId)
    });

    if (!search) {
      // Or should we return empty array? Let's return error for clarity.
      return { isSuccess: false, message: "Error: Search not found." };
    }
    if (search.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to view POIs for this search." };
    }

    // Proceed if authorized
    const pois = await db.query.pois.findMany({
      where: eq(poisTable.searchId, searchId),
      orderBy: (pois) => [pois.createdAt]
    })
    return {
      isSuccess: true,
      message: "POIs retrieved successfully",
      data: pois
    }
  } catch (error) {
    console.error("Error getting POIs:", error)
    return { isSuccess: false, message: "An internal error occurred while retrieving POIs." }
  }
}

export async function getPoiAction(
  id: string
): Promise<ActionState<SelectPoi>> {
  const { userId: authenticatedUserId } = await auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const poi = await db.query.pois.findFirst({
      where: eq(poisTable.id, id)
    })

    if (!poi) {
      return { isSuccess: false, message: "POI not found" }
    }

    // Authorization: Check if the user owns the associated search
    const search = await db.query.searches.findFirst({
      where: eq(searchesTable.id, poi.searchId)
    });

    if (!search) {
      // This indicates data inconsistency if the POI exists but the search doesn't
      console.error(`Data inconsistency: POI ${id} found but search ${poi.searchId} not found.`);
      return { isSuccess: false, message: "Error: Associated search not found." };
    }
    if (search.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to access this POI." };
    }

    return {
      isSuccess: true,
      message: "POI retrieved successfully",
      data: poi
    }
  } catch (error) {
    console.error("Error getting POI:", error)
    return { isSuccess: false, message: "An internal error occurred while retrieving the POI." }
  }
}

export async function updatePoiAction(
  id: string,
  data: Partial<Omit<InsertPoi, 'id' | 'searchId' | 'createdAt'>>
): Promise<ActionState<SelectPoi>> {
  const { userId: authenticatedUserId } = await auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    // 1. Fetch existing POI
    const existingPoi = await db.query.pois.findFirst({
      where: eq(poisTable.id, id)
    });

    if (!existingPoi) {
       return { isSuccess: false, message: "POI not found to update." };
    }

    // 2. Authorization: Check owner of associated search
    const search = await db.query.searches.findFirst({
      where: eq(searchesTable.id, existingPoi.searchId)
    });

    if (!search) {
      console.error(`Data inconsistency: POI ${id} found but search ${existingPoi.searchId} not found during update.`);
      return { isSuccess: false, message: "Error: Associated search not found." };
    }
    if (search.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to update this POI." };
    }

    // 3. Update if authorized
    const [updatedPoi] = await db
      .update(poisTable)
      .set(data)
      .where(eq(poisTable.id, id))
      .returning()

    if (!updatedPoi) {
      console.error(`[DB Action] Update failed unexpectedly after authorization for POI ID: ${id}`);
      return { isSuccess: false, message: "Failed to update POI after authorization." };
    }

    return {
      isSuccess: true,
      message: "POI updated successfully",
      data: updatedPoi
    }
  } catch (error) {
    console.error("Error updating POI:", error)
    return { isSuccess: false, message: "An internal error occurred while updating the POI." }
  }
}

export async function deletePoiAction(id: string): Promise<ActionState<void>> {
  const { userId: authenticatedUserId } = await auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    // 1. Fetch existing POI
    const existingPoi = await db.query.pois.findFirst({
      where: eq(poisTable.id, id)
    });

    if (!existingPoi) {
       return { isSuccess: false, message: "POI not found to delete." };
    }

    // 2. Authorization: Check owner of associated search
    const search = await db.query.searches.findFirst({
      where: eq(searchesTable.id, existingPoi.searchId)
    });

    if (!search) {
      console.error(`Data inconsistency: POI ${id} found but search ${existingPoi.searchId} not found during delete.`);
      // Decide if we should still delete the orphaned POI. For safety, let's not.
      return { isSuccess: false, message: "Error: Associated search not found; cannot delete POI." };
    }
    if (search.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to delete this POI." };
    }

    // 3. Delete if authorized
    await db.delete(poisTable).where(eq(poisTable.id, id))
    return {
      isSuccess: true,
      message: "POI deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting POI:", error)
    return { isSuccess: false, message: "An internal error occurred while deleting the POI." }
  }
}

export async function deletePoisBySearchAction(
  searchId: string
): Promise<ActionState<void>> {
  const { userId: authenticatedUserId } = await auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    // Authorization: Check if the user owns the associated search
    const search = await db.query.searches.findFirst({
      where: eq(searchesTable.id, searchId)
    });

    if (!search) {
      return { isSuccess: false, message: "Error: Search not found." };
    }
    if (search.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to delete POIs for this search." };
    }

    // Proceed with bulk delete if authorized
    await db.delete(poisTable).where(eq(poisTable.searchId, searchId))
    return {
      isSuccess: true,
      message: "POIs deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting POIs:", error)
    return { isSuccess: false, message: "An internal error occurred while deleting the POIs." }
  }
} 