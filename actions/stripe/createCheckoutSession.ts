'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getBaseUrl } from '@/lib/utils'; // Helper to get base URL
import { stripe } from '@/lib/stripe'; // Stripe client instance
import { getUserSubscriptionPlan } from '@/lib/auth/subscription'; // Helper to get user plan

export async function createCheckoutSession(params: { isYearly: boolean }): Promise<{ url: string | null; error?: string }> {
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

  const userPlan = await getUserSubscriptionPlan(userId);

  // If user is already on the pro plan, don't create a checkout session
  // Instead, redirect them to a billing portal (future implementation)
  if (userPlan.isPro) {
    console.log('[Checkout] User already has Pro plan');
    // TODO: Implement Stripe billing portal redirect
    // For now, just return an indication or redirect to pricing page with a message
    return { url: null, error: 'You already have the Pro plan.' };
    // Example redirect (needs proper handling):
    // const billingPortalUrl = await createBillingPortalSession(userId);
    // if (billingPortalUrl) redirect(billingPortalUrl);
  }

  const { isYearly } = params;
  const priceId = isYearly
    ? process.env.STRIPE_PRO_YEARLY_PRICE_ID
    : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

  if (!priceId) {
    console.error('[Checkout] Stripe Price ID not configured in environment variables.');
    return { url: null, error: 'Pricing configuration error. Please contact support.' };
  }

  const baseUrl = getBaseUrl();
  const successUrl = `${baseUrl}/meet-me-halfway?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/pricing`; // Go back to pricing page on cancel

  try {
    console.log(`[Checkout] Creating session for user ${userId} (${user.emailAddresses[0]?.emailAddress}) for price ${priceId}`);
    const session = await stripe.checkout.sessions.create({
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
        // Add any other relevant metadata
      },
      customer_email: user.emailAddresses[0]?.emailAddress, // Pre-fill email
      // customer: user.stripeCustomerId, // If you store stripe customer IDs
      success_url: successUrl,
      cancel_url: cancelUrl,
      // subscription_data: { // Optional: Add trial period, etc.
      //   trial_period_days: 14
      // }
    });

    console.log(`[Checkout] Session created: ${session.id}`);
    return { url: session.url };

  } catch (error) {
    console.error('[Checkout] Error creating Stripe session:', error);
    // Consider more specific error handling based on Stripe error types
    return { url: null, error: 'Failed to create checkout session. Please try again later.' };
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