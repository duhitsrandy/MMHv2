import { db } from '@/db/db';
import { profilesTable } from '@/db/schema/profiles-schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export type UserPlan = {
  isPro: boolean;
  membership: 'starter' | 'plus' | 'pro' | 'business' | null; // Match the actual db enum
  stripeCustomerId: string | null;
  // Add other relevant fields if needed, e.g., subscription end date
}

export async function getUserSubscriptionPlan(userId?: string): Promise<UserPlan> {
  let currentUserId: string | null | undefined = userId;
  if (currentUserId === undefined) {
    const authResult = auth();
    currentUserId = authResult.userId;
  }

  // Default plan for unauthenticated users or users not found
  const defaultPlan: UserPlan = {
    isPro: false,
    membership: 'starter', // starter is the default/free tier
    stripeCustomerId: null,
  };

  if (!currentUserId) {
    return defaultPlan;
  }

  try {
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, currentUserId),
      columns: {
        membership: true,
        stripeCustomerId: true,
        // Add other columns like stripeSubscriptionId, stripeSubscriptionEndDate if they exist
      },
    });

    if (!userProfile) {
      console.warn(`[Subscription] Profile not found for user ${currentUserId}. Returning default plan.`);
      return defaultPlan;
    }

    const isPro = userProfile.membership === 'pro';

    return {
      isPro,
      membership: userProfile.membership || 'starter', // Default to starter (free tier) if null/undefined
      stripeCustomerId: userProfile.stripeCustomerId,
    };
  } catch (error) {
    console.error(`[Subscription] Error fetching plan for user ${currentUserId}:`, error);
    // Return default plan on error to avoid breaking functionality
    return defaultPlan;
  }
} 