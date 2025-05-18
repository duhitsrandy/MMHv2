/*
<ai_context>
Contains server actions related to Stripe.
</ai_context>
*/

import {
  updateProfileAction,
  updateProfileByStripeCustomerIdAction
} from "@/actions/db/profiles-actions"
import { SelectProfile } from "@/db/schema"
import { stripe } from "@/lib/stripe"
import Stripe from "stripe"
import { getTierFromPriceId, Tier } from "@/lib/stripe/tier-map"

type MembershipStatus = Tier

const getMembershipStatusFromStripeEvent = (
  stripeSubscriptionStatus: Stripe.Subscription.Status,
  tierFromPriceId: Tier | null
): MembershipStatus => {
  switch (stripeSubscriptionStatus) {
    case "active":
    case "trialing":
      return tierFromPriceId || 'starter'
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
      return "starter"
    case "incomplete":
    case "past_due":
    case "paused":
      return tierFromPriceId || 'starter'
    default:
      return "starter"
  }
}

const getSubscription = async (subscriptionId: string) => {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"]
  })
}

export const updateStripeCustomer = async (
  userId: string,
  subscriptionId: string,
  customerId: string
) => {
  try {
    if (!userId || !subscriptionId || !customerId) {
      throw new Error("Missing required parameters for updateStripeCustomer")
    }

    const subscription = await getSubscription(subscriptionId)
    const priceId = subscription.items.data[0]?.price.id

    const result = await updateProfileAction(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
    })

    if (!result.isSuccess) {
      throw new Error(result.message || "Failed to update customer profile with Stripe IDs")
    }

    return result.data
  } catch (error) {
    console.error("Error in updateStripeCustomer:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to update Stripe customer details in profile")
  }
}

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string
): Promise<MembershipStatus> => {
  try {
    const subscription = await getSubscription(subscriptionId)
    
    const priceId = subscription.items.data[0]?.price.id
    if (!priceId) {
      throw new Error(`No price ID found on subscription item for subscription ${subscriptionId}`)
    }

    const tierFromPrice = getTierFromPriceId(priceId)

    if (!tierFromPrice) {
      console.error(`Warning: Price ID ${priceId} not found in PRICE_TO_TIER_MAP. Defaulting user to starter. Customer: ${customerId}`)
    }

    const finalMembershipStatus = getMembershipStatusFromStripeEvent(
      subscription.status,
      tierFromPrice
    )

    const updateData: Partial<Pick<SelectProfile, 'membership' | 'stripeSubscriptionId' | 'stripePriceId' | 'seatCount'>> = {
      stripeSubscriptionId: subscription.id,
      membership: finalMembershipStatus,
      stripePriceId: priceId,
      seatCount: finalMembershipStatus === 'business' ? 5 : 1,
    }

    const updateResult = await updateProfileByStripeCustomerIdAction(
      customerId,
      updateData
    )

    if (!updateResult.isSuccess) {
      throw new Error(`Failed to update subscription status in DB for customer ${customerId}. Message: ${updateResult.message}`)
    }

    return finalMembershipStatus
  } catch (error) {
    console.error("Error in manageSubscriptionStatusChange:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to process subscription status change")
  }
}
