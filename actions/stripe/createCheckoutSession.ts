'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getBaseUrl } from '@/lib/utils'; // Helper to get base URL
import { stripe } from '@/lib/stripe'; // Stripe client instance
import Stripe from 'stripe'; // ADDED Stripe import
import { getUserPlanInfo } from '@/lib/auth/plan'; // CORRECTED import for getUserPlanInfo

export async function createCheckoutSession(params: { priceId: string }): Promise<{ url: string | null; error?: string }> {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    // This should ideally not happen if the button is only shown to logged-in users,
    // but it's good practice to check.
    // Redirecting to login might be better, but requires handling redirects from server actions.
    // Returning an error for now.
    console.error('[Checkout] User not authenticated');
    return { url: null, error: 'User not authenticated. Please log in.' };
  }

  const userPlanInfo = await getUserPlanInfo();

  // Prevent buying the exact same plan again if they are already subscribed to it.
  // If userPlanInfo.stripePriceId matches params.priceId, redirect to billing portal.
  if (userPlanInfo && userPlanInfo.stripePriceId === params.priceId) {
      console.log(`[Checkout] User ${userId} already subscribed to this priceId ${params.priceId}. Redirecting to billing portal.`);
      // Attempt to redirect to billing portal directly from server action
      // This might need client-side handling if direct redirect isn't smooth
      const portal = await createBillingPortalSessionAction();
      if (portal.url) return { url: portal.url, error: "Already subscribed to this plan. Manage your subscription here." }; // Pass URL for client redirect
      return { url: null, error: 'You are already subscribed to this specific plan. Please manage your subscription.' };
  }
  // If user is on any paid plan (e.g. plus, pro, business) and tries to buy another paid plan,
  // Stripe handles this as an upgrade/downgrade (proration can be configured in Stripe).
  // If they are on 'starter' (free), it's a new subscription.

  const { priceId } = params;

  if (!priceId) {
    // This check is now less likely if priceId is passed directly and validated by UI
    console.error('[Checkout] Stripe Price ID not provided.');
    return { url: null, error: 'Pricing configuration error. Please contact support.' };
  }
  // We could also add a check here to ensure the priceId is one of the known ones from ALL_STRIPE_PRICE_IDS
  // from tier-map.ts for extra security, though Stripe will reject unknown price IDs anyway.

  const baseUrl = getBaseUrl();
  // Success URL can be more generic or link to an account/dashboard page
  const successUrl = `${baseUrl}/meet-me-halfway?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/pricing`; 

  try {
    console.log(`[Checkout] Creating session for user ${userId} (${user.emailAddresses[0]?.emailAddress}) for price ${priceId}`);
    
    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
      client_reference_id: userId,
      customer_email: user.emailAddresses[0]?.emailAddress,
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    // If the user already has a Stripe customer ID, pass it to avoid creating duplicates
    // and to allow Stripe to manage upgrades/downgrades correctly.
    if (userPlanInfo?.stripeCustomerId) {
      checkoutSessionParams.customer = userPlanInfo.stripeCustomerId;
    }
    
    // For Business tier, if you want to enforce a specific quantity (e.g., 5 seats) and it's not
    // configured directly in the Stripe Price object, you might need to adjust quantity here.
    // However, best practice is to have the Price ID itself represent the bundle (e.g., Business plan with 5 seats).
    // If the price is per seat for business, then quantity should be adjustable or set based on user input.
    // For simplicity, assuming Price ID for business includes the 5 seats for now.

    const session = await stripe.checkout.sessions.create(checkoutSessionParams);

    console.log(`[Checkout] Session created: ${session.id}`);
    return { url: session.url };

  } catch (error) {
    console.error('[Checkout] Error creating Stripe session:', error);
    // Consider more specific error handling based on Stripe error types
    return { url: null, error: 'Failed to create checkout session. Please try again later.' };
  }
}

export async function createBillingPortalSessionAction(): Promise<{ url: string | null; error?: string }> {
  const { userId } = auth();
  if (!userId) {
    console.error('[Billing Portal] User not authenticated');
    return { url: null, error: 'User not authenticated.' };
  }

  try {
    const userPlan = await getUserPlanInfo();
    if (!userPlan || !userPlan.stripeCustomerId) {
      console.error(`[Billing Portal] User ${userId} does not have a Stripe Customer ID or plan info is null.`);
      return { url: null, error: 'No active subscription found to manage. Please subscribe first or contact support if you believe this is an error.' };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userPlan.stripeCustomerId,
      return_url: `${getBaseUrl()}/pricing`,
    });

    return { url: portalSession.url };
  } catch (error) {
    console.error('[Billing Portal] Error creating session:', error);
    return { url: null, error: 'Could not open billing portal. Please try again.' };
  }
}

// Placeholder for billing portal session creation (implement later)
// async function createBillingPortalSession(userId: string): Promise<string | null> {
//   try {
//     const userPlan = await getUserSubscriptionPlan(userId);
//     if (!userPlan.stripeCustomerId) {
//       console.error(`[Billing Portal] User ${userId} does not have a Stripe Customer ID.`);
//       return null;
//     }

//     const portalSession = await stripe.billingPortal.sessions.create({
//       customer: userPlan.stripeCustomerId,
//       return_url: `${getBaseUrl()}/account`, // Or wherever users manage their account
//     });

//     return portalSession.url;
//   } catch (error) {
//     console.error('[Billing Portal] Error creating session:', error);
//     return null;
//   }
// } 