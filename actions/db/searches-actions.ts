"use server"

import { db } from "@/db/db"
import { InsertSearch, SelectSearch, searchesTable } from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server";

export async function createSearchAction(
  searchData: Omit<InsertSearch, 'userId' | 'id' | 'createdAt'>
): Promise<ActionState<SelectSearch>> {
  console.log("[DB Action] createSearchAction called with:", searchData);
  const { userId } = await auth();
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

export async function getSearchesAction(
  targetUserId: string
): Promise<ActionState<SelectSearch[]>> {
  const { userId: authenticatedUserId } = await auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }
  if (authenticatedUserId !== targetUserId) {
    return { isSuccess: false, message: "Error: Unauthorized to access these searches." };
  }

  try {
    const searches = await db.query.searches.findMany({
      where: eq(searchesTable.userId, targetUserId),
      orderBy: (searches) => [searches.createdAt]
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
  const { userId: authenticatedUserId } = await auth();
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
  const { userId: authenticatedUserId } = await auth();
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
  const { userId: authenticatedUserId } = await auth();
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