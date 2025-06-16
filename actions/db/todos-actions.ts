/*
<ai_context>
Contains server actions related to todos in the DB.
</ai_context>
*/

"use server"

import { db } from "@/db/db"
import { InsertTodo, SelectTodo, todosTable } from "@/db/schema/todos-schema"
import { ActionState } from "@/types"
import { and, eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server";

export async function createTodoAction(
  todoData: Omit<InsertTodo, 'userId' | 'id' | 'createdAt' | 'updatedAt'> // Assuming timestamps exist
): Promise<ActionState<SelectTodo>> {
  const { userId } = auth();
  if (!userId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const todoToInsert: InsertTodo = {
      ...todoData,
      userId: userId, // Use authenticated userId
    };
    const [newTodo] = await db.insert(todosTable).values(todoToInsert).returning()
    return {
      isSuccess: true,
      message: "Todo created successfully",
      data: newTodo
    }
  } catch (error) {
    console.error("Error creating todo:", error)
    return { isSuccess: false, message: "An internal error occurred while creating the todo." }
  }
}

export async function getTodosAction(
  targetUserId: string
): Promise<ActionState<SelectTodo[]>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }
  if (authenticatedUserId !== targetUserId) {
    return { isSuccess: false, message: "Error: Unauthorized to access these todos." };
  }

  try {
    const todos = await db.query.todos.findMany({
      where: eq(todosTable.userId, targetUserId)
    })
    return {
      isSuccess: true,
      message: "Todos retrieved successfully",
      data: todos
    }
  } catch (error) {
    console.error("Error getting todos:", error)
    return { isSuccess: false, message: "An internal error occurred while retrieving todos." }
  }
}

export async function updateTodoAction(
  id: string,
  data: Partial<Omit<InsertTodo, 'userId' | 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ActionState<SelectTodo>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    // 1. Fetch existing todo for authorization
    const existingTodo = await db.query.todos.findFirst({
      where: eq(todosTable.id, id)
    });

    if (!existingTodo) {
      return { isSuccess: false, message: "Todo not found to update." };
    }

    // 2. Authorize
    if (existingTodo.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to update this todo." };
    }

    // 3. Update
    const [updatedTodo] = await db
      .update(todosTable)
      .set(data)
      .where(eq(todosTable.id, id))
      .returning()

    if (!updatedTodo) {
      // Should not happen if above checks passed
      console.error(`[DB Action] Update failed unexpectedly after authorization for todo ID: ${id}`);
      return { isSuccess: false, message: "Failed to update todo after authorization." };
    }

    return {
      isSuccess: true,
      message: "Todo updated successfully",
      data: updatedTodo
    }
  } catch (error) {
    console.error("Error updating todo:", error)
    return { isSuccess: false, message: "An internal error occurred while updating the todo." }
  }
}

export async function deleteTodoAction(id: string): Promise<ActionState<void>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    // 1. Fetch existing todo for authorization
    const existingTodo = await db.query.todos.findFirst({
      where: eq(todosTable.id, id)
    });

    if (!existingTodo) {
      return { isSuccess: false, message: "Todo not found to delete." };
    }

    // 2. Authorize
    if (existingTodo.userId !== authenticatedUserId) {
      return { isSuccess: false, message: "Error: Unauthorized to delete this todo." };
    }

    // 3. Delete
    await db.delete(todosTable).where(and(eq(todosTable.id, id), eq(todosTable.userId, authenticatedUserId)));
    return {
      isSuccess: true,
      message: "Todo deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting todo:", error)
    return { isSuccess: false, message: "An internal error occurred while deleting the todo." }
  }
}
