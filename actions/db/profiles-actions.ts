/*
<ai_context>
Contains server actions related to profiles in the DB.
</ai_context>
*/

"use server"

import { db } from "@/db/db"
import {
  InsertProfile,
  profilesTable,
  SelectProfile
} from "@/db/schema/profiles-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export async function createProfileAction(
  data: Omit<InsertProfile, 'userId' | 'createdAt' | 'updatedAt' | 'id' | 'stripeCustomerId' | 'stripeSubscriptionId' | 'stripePriceId' | 'stripeCurrentPeriodEnd'>
): Promise<ActionState<SelectProfile>> {
  const { userId } = auth();
  if (!userId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  try {
    const profileToInsert: InsertProfile = {
      ...data,
      userId: userId,
    };
    const [newProfile] = await db.insert(profilesTable).values(profileToInsert).returning()
    return {
      isSuccess: true,
      message: "Profile created successfully",
      data: newProfile
    }
  } catch (error) {
    console.error("Error creating profile:", error)
    return { isSuccess: false, message: "An internal error occurred while creating the profile." }
  }
}

export async function getProfileByUserIdAction(
  targetUserId: string
): Promise<ActionState<SelectProfile>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  if (authenticatedUserId !== targetUserId) {
    return { isSuccess: false, message: "Error: Unauthorized to access this profile." };
  }

  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, targetUserId)
    })
    if (!profile) {
      return { isSuccess: false, message: "Profile not found" }
    }

    return {
      isSuccess: true,
      message: "Profile retrieved successfully",
      data: profile
    }
  } catch (error) {
    console.error("Error getting profile by user id:", error)
    return { isSuccess: false, message: "An internal error occurred while retrieving the profile." }
  }
}

export async function updateProfileAction(
  targetUserId: string,
  data: Partial<Omit<InsertProfile, 'userId' | 'createdAt' | 'updatedAt' | 'id'>>
): Promise<ActionState<SelectProfile>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  if (authenticatedUserId !== targetUserId) {
    return { isSuccess: false, message: "Error: Unauthorized to update this profile." };
  }

  try {
    const [updatedProfile] = await db
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.userId, targetUserId))
      .returning()

    if (!updatedProfile) {
      return { isSuccess: false, message: "Profile not found to update" }
    }

    return {
      isSuccess: true,
      message: "Profile updated successfully",
      data: updatedProfile
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { isSuccess: false, message: "An internal error occurred while updating the profile." }
  }
}

export async function updateProfileByStripeCustomerIdAction(
  stripeCustomerId: string,
  data: Partial<InsertProfile>
): Promise<ActionState<SelectProfile>> {
  try {
    const [updatedProfile] = await db
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.stripeCustomerId, stripeCustomerId))
      .returning()

    if (!updatedProfile) {
      return {
        isSuccess: false,
        message: "Profile not found by Stripe customer ID"
      }
    }

    return {
      isSuccess: true,
      message: "Profile updated by Stripe customer ID successfully",
      data: updatedProfile
    }
  } catch (error) {
    console.error("Error updating profile by stripe customer ID:", error)
    return {
      isSuccess: false,
      message: "An internal error occurred while updating the profile via Stripe ID."
    }
  }
}

export async function deleteProfileAction(
  targetUserId: string
): Promise<ActionState<void>> {
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    return { isSuccess: false, message: "Error: User is not authenticated." };
  }

  if (authenticatedUserId !== targetUserId) {
    return { isSuccess: false, message: "Error: Unauthorized to delete this profile." };
  }

  try {
    const result = await db.delete(profilesTable).where(eq(profilesTable.userId, targetUserId));

    return {
      isSuccess: true,
      message: "Profile deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting profile:", error)
    return { isSuccess: false, message: "An internal error occurred while deleting the profile." }
  }
}
