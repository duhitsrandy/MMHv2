import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { profilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ userId: null, tier: "starter" });
    }

    const result = await db
      .select({ membership: profilesTable.membership })
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);

    const tier = result[0]?.membership ?? "starter";

    return NextResponse.json({ userId, tier });
  } catch (error) {
    console.error("[/api/mobile/profile] Error:", error);
    return NextResponse.json({ userId: null, tier: "starter" });
  }
}
