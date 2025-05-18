// lib/stripe/tier-map.ts

export const PRICE_TO_TIER_MAP = {
  // Plus Tier
  [process.env.STRIPE_PRICE_PLUS_WEEKLY!]:    'plus',
  [process.env.STRIPE_PRICE_PLUS_MONTHLY!]:   'plus',
  [process.env.STRIPE_PRICE_PLUS_YEARLY!]:    'plus',

  // Pro Tier
  [process.env.STRIPE_PRICE_PRO_WEEKLY!]:     'pro',
  [process.env.STRIPE_PRICE_PRO_MONTHLY!]:    'pro',
  [process.env.STRIPE_PRICE_PRO_YEARLY!]:     'pro',

  // Business Tier
  [process.env.STRIPE_PRICE_BUSINESS_WEEKLY!]:  'business',
  [process.env.STRIPE_PRICE_BUSINESS_MONTHLY!]: 'business',
  [process.env.STRIPE_PRICE_BUSINESS_YEARLY!]:  'business',
} as const;

export type Tier = 'starter' | 'plus' | 'pro' | 'business';

// Helper to get all defined price IDs
export const ALL_STRIPE_PRICE_IDS = Object.keys(PRICE_TO_TIER_MAP);

// Helper function to get tier from a price ID
export function getTierFromPriceId(priceId: string): Tier | null {
  return PRICE_TO_TIER_MAP[priceId as keyof typeof PRICE_TO_TIER_MAP] || null;
}

// Define prices and features for the pricing page dynamically
// (Prices here are illustrative, they should match your Stripe product configuration)
// You might fetch these from Stripe API directly for a more dynamic pricing page in a real app.

export const TIER_DETAILS = {
  starter: {
    name: 'Starter',
    description: 'For occasional users and basic midpoint searches.',
    priceMonthly: 0,
    features: [
      "Up to 2 locations for midpoint calculation",
      "Standard place search & route calculation",
      "Community support",
    ],
    stripePriceIds: {}, // No specific checkout for free
    displayPrices: { weekly: 0, monthly: 0, yearly: 0 }, // ADDED to satisfy type, though not used for checkout
  },
  plus: {
    name: 'Plus',
    description: 'For enhanced features and more frequent use.',
    priceMonthly: 9, // Example price
    features: [
      "Up to 3 locations for midpoint calculation", // Example feature differentiation
      "Faster route calculations",
      "Save up to 10 favorite locations",
      "Basic email support",
    ],
    stripePriceIds: {
      weekly: process.env.STRIPE_PRICE_PLUS_WEEKLY!,
      monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_PLUS_YEARLY!,
    },
    displayPrices: { // For UI display
      weekly: 2.49,
      monthly: 9,
      yearly: 90, // Equivalent to $7.50/month
    }
  },
  pro: {
    name: 'Pro',
    description: 'For frequent users needing advanced features and precision.',
    priceMonthly: 19, // Example price
    features: [
      "Up to 5 locations for midpoint calculation",
      "Real-time traffic data for accurate ETAs",
      "Saved searches and unlimited favorite locations",
      "Advanced analytics & fairness scores (Coming Soon)",
      "Priority email support",
    ],
    stripePriceIds: {
      weekly: process.env.STRIPE_PRICE_PRO_WEEKLY!,
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
    },
    displayPrices: {
      weekly: 4.99,
      monthly: 19,
      yearly: 190, // Equivalent to ~$15.83/month
    }
  },
  business: {
    name: 'Business',
    description: 'For teams and businesses needing robust solutions.',
    priceMonthly: 99, // Example price
    features: [
      "Up to 10 locations for midpoint calculation",
      "Includes 5 seats (user licenses)",
      "All Pro features",
      "Dedicated account manager (Coming Soon)",
      "Custom integration options (Coming Soon)",
    ],
    stripePriceIds: {
      weekly: process.env.STRIPE_PRICE_BUSINESS_WEEKLY!,
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY!,
    },
    displayPrices: {
      weekly: 24.99,
      monthly: 99,
      yearly: 990, // Equivalent to $82.50/month
    }
  }
} as const;

export type TierName = keyof typeof TIER_DETAILS;
export type Cadence = 'weekly' | 'monthly' | 'yearly'; 