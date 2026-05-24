import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createBillingPortalUrl,
  getProfileStripeFields,
} from "@/lib/stripe/mobile-stripe";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileStripeFields(userId);
    if (!profile?.stripeCustomerId) {
      return NextResponse.json(
        {
          error: "no_active_customer",
          message:
            "No active subscription found to manage. Please subscribe first or contact support if you believe this is an error.",
        },
        { status: 400 }
      );
    }

    const url = await createBillingPortalUrl(profile.stripeCustomerId);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[/api/mobile/stripe/billing-portal] Error:", error);
    return NextResponse.json(
      { error: "Could not open billing portal. Please try again." },
      { status: 500 }
    );
  }
}
