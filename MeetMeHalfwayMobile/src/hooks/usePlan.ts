import { useMemo } from "react";

export type MobileTier = "starter" | "plus" | "pro" | "business";

function parseTier(value?: string): MobileTier {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "plus") return "plus";
  if (normalized === "pro") return "pro";
  if (normalized === "business") return "business";
  return "starter";
}

function getMaxLocations(tier: MobileTier) {
  switch (tier) {
    case "plus":
      return 3;
    case "pro":
      return 5;
    case "business":
      return 10;
    default:
      return 2;
  }
}

export function usePlan() {
  const tier = parseTier(process.env.EXPO_PUBLIC_MOBILE_PLAN_TIER);
  return useMemo(
    () => ({
      tier,
      maxLocations: getMaxLocations(tier),
      isProOrHigher: tier === "pro" || tier === "business",
    }),
    [tier]
  );
}

