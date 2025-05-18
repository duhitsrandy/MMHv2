import { db } from "@/db/db" // Adjusted path
import { profilesTable, SelectProfile } from "@/db/schema/profiles-schema" // Adjusted path, imported SelectProfile
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server" // Use server import
// import { UserPlan } from "@/types/index" // OLD type, will use Tier from tier-map
import { Tier } from "@/lib/stripe/tier-map" // NEW: Import Tier

export type UserPlanInfo = {
  tier: Tier;
  // Add other relevant plan details if needed from profilesTable
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  seatCount?: number | null;
};

/**
 * Fetches the membership plan details for the currently authenticated user from the database.
 * @returns The user's plan details or null if not found/not authenticated.
 */
export async function getUserPlanInfo(): Promise<UserPlanInfo | null> { // RENAMED and new return type
  try {
    const { userId } = auth()
    if (!userId) {
      return null // Not authenticated
    }

    const result: Pick<SelectProfile, 'membership' | 'stripeCustomerId' | 'stripeSubscriptionId' | 'stripePriceId' | 'seatCount'>[] = await db
      .select({
        membership: profilesTable.membership,
        stripeCustomerId: profilesTable.stripeCustomerId,
        stripeSubscriptionId: profilesTable.stripeSubscriptionId,
        stripePriceId: profilesTable.stripePriceId,
        seatCount: profilesTable.seatCount,
      })
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1)

    if (result.length > 0 && result[0].membership) {
      const profileData = result[0]
      // console.log(`[getUserPlanInfo] Found profile for ${userId}, membership: ${profileData.membership}`);
      return {
        tier: profileData.membership as Tier, // Cast as Tier, assuming DB schema is updated
        stripeCustomerId: profileData.stripeCustomerId,
        stripeSubscriptionId: profileData.stripeSubscriptionId,
        stripePriceId: profileData.stripePriceId,
        seatCount: profileData.seatCount,
      }
    } else {
      // If no profile, or no membership, they are effectively 'starter' tier
      // console.warn(`[getUserPlanInfo] Profile/membership not found for userId: ${userId}. Defaulting to 'starter'.`);
      return { tier: 'starter' } // Default to starter if no specific plan found
    }
  } catch (error) {
    console.error("Error fetching user plan info:", error)
    return { tier: 'starter' } // Fallback to starter on error
  }
}

/**
 * Server Action helper to ensure the current user has at least a specified plan.
 * Throws an error if the user is not authenticated or doesn't meet the required tier.
 * @param {Tier} requiredTier - The minimum tier required.
 * @throws {Error} If user does not meet criteria.
 */
export async function requirePlan(requiredTiers: Tier[]): Promise<UserPlanInfo> {
  const { userId } = auth()
  if (!userId) {
    throw new Error("UNAUTHORIZED: Authentication required.")
  }

  const planInfo = await getUserPlanInfo()

  if (!planInfo || !requiredTiers.includes(planInfo.tier)) {
    const message = `FORBIDDEN: This feature requires one of the following plans: ${requiredTiers.join(", ")}. Your current plan is ${planInfo?.tier || 'starter'}. Please upgrade.`
    throw new Error(message)
  }
  return planInfo // Return planInfo if check passes
}

// Example specific requirement functions:
export async function requirePlusPlan(): Promise<UserPlanInfo> {
  return requirePlan(['plus', 'pro', 'business'])
}

export async function requireProPlan(): Promise<UserPlanInfo> {
  return requirePlan(['pro', 'business'])
}

export async function requireBusinessPlan(): Promise<UserPlanInfo> {
  return requirePlan(['business'])
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