import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import {
  locationsTable,
  profilesTable,
  searchesTable,
  todosTable,
} from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { getProfileStripeFields } from "@/lib/stripe/mobile-stripe";

/**
 * Cascade-deletes MMH data for a user, cancels an active Stripe subscription when
 * present, then removes the Clerk user. DB cleanup runs before Clerk so a Clerk
 * failure does not leave orphaned app data without a retry path.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const profileStripe = await getProfileStripeFields(userId);

  if (profileStripe?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(profileStripe.stripeSubscriptionId);
    } catch (error) {
      console.error(
        "[deleteUserAccount] Stripe subscription cancel failed:",
        error
      );
    }
  }

  await db.delete(searchesTable).where(eq(searchesTable.userId, userId));
  await db.delete(locationsTable).where(eq(locationsTable.userId, userId));
  await db.delete(todosTable).where(eq(todosTable.userId, userId));
  await db.delete(profilesTable).where(eq(profilesTable.userId, userId));

  const client = await clerkClient();
  await client.users.deleteUser(userId);
}
