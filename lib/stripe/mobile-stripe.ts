import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { profilesTable } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { ALL_STRIPE_PRICE_IDS } from "@/lib/stripe/tier-map";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export const STRIPE_MOBILE_API_VERSION = "2024-06-20" as const;

export const MOBILE_BILLING_PORTAL_RETURN_URL =
  process.env.STRIPE_PORTAL_MOBILE_RETURN_URL ?? "mmh://billing-return";

export type MobileProfileStripe = {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
};

export function isAllowedPriceId(priceId: string): boolean {
  return ALL_STRIPE_PRICE_IDS.includes(priceId);
}

export async function getProfileStripeFields(
  userId: string
): Promise<MobileProfileStripe | null> {
  const rows = await db
    .select({
      stripeCustomerId: profilesTable.stripeCustomerId,
      stripeSubscriptionId: profilesTable.stripeSubscriptionId,
      stripePriceId: profilesTable.stripePriceId,
    })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export async function setProfileStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await db
    .update(profilesTable)
    .set({ stripeCustomerId })
    .where(eq(profilesTable.userId, userId));
}

export async function ensureStripeCustomer(
  userId: string,
  profile: MobileProfileStripe | null
): Promise<string> {
  if (profile?.stripeCustomerId) {
    return profile.stripeCustomerId;
  }

  const user = await currentUser();
  let email =
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

  if (!email) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
  }

  if (!email) {
    throw new Error("NO_EMAIL");
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await setProfileStripeCustomerId(userId, customer.id);
  return customer.id;
}

export async function createBillingPortalUrl(
  stripeCustomerId: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: MOBILE_BILLING_PORTAL_RETURN_URL,
  });
  if (!session.url) {
    throw new Error("PORTAL_URL_MISSING");
  }
  return session.url;
}

function getPaymentIntentFromSubscription(
  subscription: Stripe.Subscription
): Stripe.PaymentIntent {
  const invoice = subscription.latest_invoice;
  if (!invoice || typeof invoice === "string") {
    throw new Error("INVOICE_MISSING");
  }
  const paymentIntent = invoice.payment_intent;
  if (!paymentIntent || typeof paymentIntent === "string") {
    throw new Error("PAYMENT_INTENT_MISSING");
  }
  if (!paymentIntent.client_secret) {
    throw new Error("CLIENT_SECRET_MISSING");
  }
  return paymentIntent;
}

export type MobilePaymentSheetPayload = {
  paymentIntentClientSecret: string;
  ephemeralKeySecret: string;
  customerId: string;
  publishableKey: string;
  subscriptionId: string;
};

export async function createMobileSubscriptionPaymentSheet(
  userId: string,
  priceId: string,
  profile: MobileProfileStripe | null,
  customerId: string
): Promise<MobilePaymentSheetPayload> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error("PUBLISHABLE_KEY_MISSING");
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: STRIPE_MOBILE_API_VERSION }
  );
  if (!ephemeralKey.secret) {
    throw new Error("EPHEMERAL_KEY_MISSING");
  }

  let subscription: Stripe.Subscription;

  if (profile?.stripeSubscriptionId) {
    const existing = await stripe.subscriptions.retrieve(
      profile.stripeSubscriptionId
    );
    const activeLike = ["active", "trialing", "past_due", "unpaid"].includes(
      existing.status
    );

    if (activeLike && existing.items.data[0]) {
      subscription = await stripe.subscriptions.update(existing.id, {
        items: [{ id: existing.items.data[0].id, price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: { userId, source: "mobile" },
      });
    } else {
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: { userId, source: "mobile" },
      });
    }
  } else {
    subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId, source: "mobile" },
    });
  }

  const paymentIntent = getPaymentIntentFromSubscription(subscription);

  return {
    paymentIntentClientSecret: paymentIntent.client_secret!,
    ephemeralKeySecret: ephemeralKey.secret,
    customerId,
    publishableKey,
    subscriptionId: subscription.id,
  };
}
