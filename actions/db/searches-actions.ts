"use server"

import { db } from "@/db/db"
import { InsertSearch, SelectSearch, searchesTable, InsertSearchOrigin, searchOriginsTable } from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, desc, asc } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server";

// Legacy format for backward compatibility
export async function createSearchAction(
  searchData: Omit<InsertSearch, 'userId' | 'id' | 'createdAt'>
): Promise<ActionState<SelectSearch>> {
  console.log("[DB Action] createSearchAction called with:", searchData);
  const { userId } = auth();
  if (!userId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const searchToInsert: InsertSearch = {
      ...searchData,
      userId: userId,
    };
    const [newSearch] = await db.insert(searchesTable).values(searchToInsert).returning()
    console.log("[DB Action] createSearchAction successful:", newSearch);
    return {
      isSuccess: true,
      message: "Search created successfully",
      data: newSearch
    }
  } catch (error) {
    console.error("Error creating search:", error)
    return { isSuccess: false, message: "An internal error occurred while creating the search." }
  }
}

// New multi-origin search action
export async function createMultiOriginSearchAction(
  origins: Array<{
    address: string;
    latitude: string;
    longitude: string;
    displayName?: string;
  }>,
  searchMetadata?: any
): Promise<ActionState<SelectSearch>> {
  console.log("[DB Action] createMultiOriginSearchAction called with:", { origins, searchMetadata });
  const { userId } = auth();
  if (!userId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  if (origins.length < 2) {
    return { isSuccess: false, message: "At least 2 origins are required." };
  }

  try {
    // Use database transaction to ensure consistency
    const result = await db.transaction(async (tx) => {
      // Create the search record
      const searchData: InsertSearch = {
        userId: userId,
        originCount: origins.length,
        searchMetadata: searchMetadata,
        // For backward compatibility, populate legacy fields if exactly 2 origins
        ...(origins.length === 2 ? {
          startLocationAddress: origins[0].address,
          startLocationLat: origins[0].latitude,
          startLocationLng: origins[0].longitude,
          endLocationAddress: origins[1].address,
          endLocationLat: origins[1].latitude,
          endLocationLng: origins[1].longitude,
          midpointLat: "0", // Placeholder - would be calculated in the frontend
          midpointLng: "0"
        } : {})
      };

      const [newSearch] = await tx.insert(searchesTable).values(searchData).returning();

      // Create search origin records
      const originData: InsertSearchOrigin[] = origins.map((origin, index) => ({
        searchId: newSearch.id,
        orderIndex: index,
        address: origin.address,
        latitude: origin.latitude,
        longitude: origin.longitude,
        displayName: origin.displayName || origin.address
      }));

      await tx.insert(searchOriginsTable).values(originData);

      return newSearch;
    });

    console.log("[DB Action] createMultiOriginSearchAction successful:", result);
    return {
      isSuccess: true,
      message: "Search created successfully",
      data: result
    }
  } catch (error) {
    console.error("Error creating multi-origin search:", error)
    return { isSuccess: false, message: "An internal error occurred while creating the search." }
  }
}

export async function getSearchesAction(
  targetUserId: string
): Promise<ActionState<SelectSearch[]>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }
  if (authenticatedUserId !== targetUserId) {
    return { isSuccess: false, message: "Error: Unauthorized to access these searches." };
  }

  try {
    const searches = await db.query.searches.findMany({
      where: eq(searchesTable.userId, targetUserId),
      orderBy: (searches) => [desc(searches.createdAt)]
    })
    return {
      isSuccess: true,
      message: "Searches retrieved successfully",
      data: searches
    }
  } catch (error) {
    console.error("Error getting searches:", error)
    return { isSuccess: false, message: "An internal error occurred while retrieving searches." }
  }
}

export async function getSearchAction(
  id: string
): Promise<ActionState<SelectSearch>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const search = await db.query.searches.findFirst({
      where: eq(searchesTable.id, id)
    })

    if (!search) {
      return { isSuccess: false, message: "Search not found" }
    }

    if (search.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to access this search." };
    }

    return {
      isSuccess: true,
      message: "Search retrieved successfully",
      data: search
    }
  } catch (error) {
    console.error("Error getting search:", error)
    return { isSuccess: false, message: "An internal error occurred while retrieving the search." }
  }
}

export async function updateSearchAction(
  id: string,
  data: Partial<Omit<InsertSearch, 'userId' | 'id' | 'createdAt'>>
): Promise<ActionState<SelectSearch>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const existingSearch = await db.query.searches.findFirst({
      where: eq(searchesTable.id, id)
    });

    if (!existingSearch) {
      return { isSuccess: false, message: "Search not found to update." };
    }

    if (existingSearch.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to update this search." };
    }

    const [updatedSearch] = await db
      .update(searchesTable)
      .set(data)
      .where(eq(searchesTable.id, id))
      .returning()

    if (!updatedSearch) {
      console.error(`[DB Action] Update failed unexpectedly after authorization for search ID: ${id}`);
      return { isSuccess: false, message: "Failed to update search after authorization." };
    }

    return {
      isSuccess: true,
      message: "Search updated successfully",
      data: updatedSearch
    }
  } catch (error) {
    console.error("Error updating search:", error)
    return { isSuccess: false, message: "An internal error occurred while updating the search." }
  }
}

export async function deleteSearchAction(id: string): Promise<ActionState<void>> {
  console.log(`[DB Action] deleteSearchAction called for ID: ${id}`);
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const existingSearch = await db.query.searches.findFirst({
      where: eq(searchesTable.id, id)
    });

    if (!existingSearch) {
      return { isSuccess: false, message: "Search not found to delete." };
    }

    if (existingSearch.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to delete this search." };
    }

    await db.delete(searchesTable).where(and(eq(searchesTable.id, id), eq(searchesTable.userId, authenticatedUserId)));
    console.log(`[DB Action] deleteSearchAction successful for ID: ${id}`);
    return {
      isSuccess: true,
      message: "Search deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting search:", error)
    return { isSuccess: false, message: "An internal error occurred while deleting the search." }
  }
}

// Get searches with their origins for enhanced display
export async function getSearchesWithOriginsAction(
  targetUserId: string
): Promise<ActionState<Array<SelectSearch & { origins?: Array<{ address: string; latitude: string; longitude: string; displayName?: string | null; orderIndex: number }> }>>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }
  if (authenticatedUserId !== targetUserId) {
    return { isSuccess: false, message: "Error: Unauthorized to access these searches." };
  }

  try {
    const searches = await db.query.searches.findMany({
      where: eq(searchesTable.userId, targetUserId),
      orderBy: (searches) => [desc(searches.createdAt)]
    });

    // Get origins for each search
    const searchesWithOrigins = await Promise.all(
      searches.map(async (search) => {
        if (search.originCount && search.originCount > 2) {
          // Get origins from search_origins table
          const origins = await db
            .select({
              address: searchOriginsTable.address,
              latitude: searchOriginsTable.latitude,
              longitude: searchOriginsTable.longitude,
              displayName: searchOriginsTable.displayName,
              orderIndex: searchOriginsTable.orderIndex
            })
            .from(searchOriginsTable)
            .where(eq(searchOriginsTable.searchId, search.id))
            .orderBy(searchOriginsTable.orderIndex);

          return { ...search, origins };
        } else {
          // For legacy 2-location searches, construct origins from legacy fields
          const origins = [];
          if (search.startLocationAddress && search.startLocationLat && search.startLocationLng) {
            origins.push({
              address: search.startLocationAddress,
              latitude: search.startLocationLat,
              longitude: search.startLocationLng,
              displayName: search.startLocationAddress,
              orderIndex: 0
            });
          }
          if (search.endLocationAddress && search.endLocationLat && search.endLocationLng) {
            origins.push({
              address: search.endLocationAddress,
              latitude: search.endLocationLat,
              longitude: search.endLocationLng,
              displayName: search.endLocationAddress,
              orderIndex: 1
            });
          }
          return { ...search, origins: origins.length > 0 ? origins : undefined };
        }
      })
    );

    return {
      isSuccess: true,
      message: "Searches with origins retrieved successfully",
      data: searchesWithOrigins
    }
  } catch (error) {
    console.error("Error getting searches with origins:", error)
    return { isSuccess: false, message: "An internal error occurred while getting searches with origins." }
  }
} 