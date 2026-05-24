export type Tier = "starter" | "plus" | "pro" | "business";

export const TIER_MAX_LOCATIONS: Record<Tier, number> = {
  starter: 2,
  plus: 3,
  pro: 5,
  business: 10,
};

export function getMaxLocationsForTier(tier: Tier | null | undefined): number {
  if (!tier) return TIER_MAX_LOCATIONS.starter;
  return TIER_MAX_LOCATIONS[tier] ?? TIER_MAX_LOCATIONS.starter;
}
