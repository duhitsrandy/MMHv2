import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createBillingPortalUrl,
  createMobileSubscriptionPaymentSheet,
  ensureStripeCustomer,
  getProfileStripeFields,
  isAllowedPriceId,
} from "@/lib/stripe/mobile-stripe";

type CheckoutBody = {
  priceId?: string;
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: CheckoutBody;
    try {
      body = (await request.json()) as CheckoutBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const priceId = typeof body.priceId === "string" ? body.priceId.trim() : "";
    if (!priceId) {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }
    if (!isAllowedPriceId(priceId)) {
      return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
    }

    const profile = await getProfileStripeFields(userId);

    if (profile?.stripePriceId === priceId) {
      if (!profile.stripeCustomerId) {
        return NextResponse.json(
          {
            error:
              "You are already on this plan but billing is not linked. Please contact support.",
          },
          { status: 400 }
        );
      }
      const portalUrl = await createBillingPortalUrl(profile.stripeCustomerId);
      return NextResponse.json({
        alreadySubscribed: true,
        portalUrl,
        message: "Already subscribed to this plan. Manage your subscription here.",
      });
    }

    const customerId = await ensureStripeCustomer(userId, profile);
    const payload = await createMobileSubscriptionPaymentSheet(
      userId,
      priceId,
      profile,
      customerId
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[/api/mobile/stripe/checkout-session] Error:", error);
    if (error instanceof Error) {
      if (error.message === "NO_EMAIL") {
        return NextResponse.json(
          { error: "Account email is required to subscribe." },
          { status: 400 }
        );
      }
      if (
        error.message === "PUBLISHABLE_KEY_MISSING" ||
        error.message === "CLIENT_SECRET_MISSING"
      ) {
        return NextResponse.json(
          { error: "Payment configuration error. Please contact support." },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}
