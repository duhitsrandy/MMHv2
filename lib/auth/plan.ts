import { db } from "../../db/db" // Relative path
import { profilesTable } from "../../db/schema/profiles-schema" // Relative path
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server" // Use server import
import { UserPlan } from "../../types/index" // Relative path

/**
 * Fetches the membership plan for the currently authenticated user from the database.
 * @returns The user's plan ('free' or 'pro') or null if not found/not authenticated.
 */
export async function getUserPlan(): Promise<UserPlan | null> {
  try {
    const { userId } = auth()
    if (!userId) {
      return null // Not authenticated
    }

    const profile = await db
      .select({
        membership: profilesTable.membership,
      })
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1)

    // Check if profile exists and has a membership
    if (profile.length > 0 && profile[0].membership) {
       console.log(`[getUserPlan] Found profile for ${userId}, membership: ${profile[0].membership}`);
       return profile[0].membership; // Return 'free' or 'pro'
    } else {
       // Log specific reason for returning null
       if (profile.length === 0) {
         console.warn(`[getUserPlan] Profile not found for userId: ${userId}. Returning null.`);
       } else {
         console.warn(`[getUserPlan] Profile found for ${userId}, but membership column is null/empty. Returning null.`);
       }
       return null; // Profile not found or membership is null/empty
    }
  } catch (error) {
    console.error("Error fetching user plan:", error)
    // Re-throwing might be better in some contexts, but returning null hides internal errors.
    return null
  }
}

/**
 * Server Action helper to ensure the current user has a 'pro' plan.
 * Throws an error if the user is not authenticated or not on the 'pro' plan.
 * @throws {Error} If user is not authenticated or not 'pro'.
 */
export async function requireProPlan(): Promise<void> {
  const { userId } = auth()
  if (!userId) {
    // Use standard Error for now
    throw new Error("UNAUTHORIZED: Authentication required.")
  }

  const plan = await getUserPlan()

  if (plan !== "pro") {
    // Use standard Error for now
    throw new Error(
      "FORBIDDEN: This feature requires a Pro plan. Please upgrade your account."
    )
  }
}

// Note: Ensure UserPlan type is defined in ~/types/index.ts
// e.g.: export type UserPlan = 'free' | 'pro';

// Define AppError if needed
// export class AppError extends Error {
//   constructor(public code: string, message: string) {
//     super(message);
//     this.name = 'AppError';
//   }
// } 