import { API_BASE } from "./api";

export const BILLING_RETURN_URL = "mmh://billing-return";
export const STRIPE_REDIRECT_URL = "mmh://stripe-redirect";

export const mobilePriceIds = {
  plus: process.env.EXPO_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY ?? "",
  pro: process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "",
  business: process.env.EXPO_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY ?? "",
} as const;

export type UpgradeTierKey = keyof typeof mobilePriceIds;

export type CheckoutSessionResponse =
  | {
      paymentIntentClientSecret: string;
      ephemeralKeySecret: string;
      customerId: string;
      publishableKey: string;
      subscriptionId: string;
    }
  | {
      alreadySubscribed: true;
      portalUrl: string;
      message?: string;
    };

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function createMobileCheckoutSession(
  priceId: string,
  token: string
): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${API_BASE}/api/mobile/stripe/checkout-session`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ priceId }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : `Checkout failed (${response.status})`;
    throw new Error(message);
  }

  return data as CheckoutSessionResponse;
}

export async function createMobileBillingPortal(token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/mobile/stripe/billing-portal`, {
    method: "POST",
    headers: authHeaders(token),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (data?.error === "no_active_customer") {
      throw new Error(
        data?.message ??
          "No active subscription found to manage. Please subscribe first."
      );
    }
    const message =
      typeof data?.error === "string"
        ? data.error
        : `Billing portal failed (${response.status})`;
    throw new Error(message);
  }

  if (typeof data?.url !== "string" || !data.url) {
    throw new Error("Billing portal URL missing");
  }

  return data.url;
}
