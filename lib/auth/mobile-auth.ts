import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { profilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Tier } from "@/lib/stripe/tier-map";

export type MobileAuthContext = {
  userId: string | null;
  tier: Tier;
};

function parseTier(value: string | null | undefined): Tier {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "plus") return "plus";
  if (normalized === "pro") return "pro";
  if (normalized === "business") return "business";
  return "starter";
}

/** Resolves Clerk session + profile tier for mobile API routes. */
export async function getMobileAuthContext(): Promise<MobileAuthContext> {
  const { userId } = await auth();

  if (!userId) {
    return { userId: null, tier: "starter" };
  }

  const result = await db
    .select({ membership: profilesTable.membership })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);

  const tier = parseTier(result[0]?.membership ?? "starter");
  return { userId, tier };
}
