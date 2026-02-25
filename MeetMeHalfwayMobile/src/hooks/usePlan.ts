import { useSafeAuth as useAuth } from "../../app/_layout";
import { useEffect, useState } from "react";
import { API_BASE } from "../services/api";

export type MobileTier = "starter" | "plus" | "pro" | "business";

function parseTier(value?: string): MobileTier {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "plus") return "plus";
  if (normalized === "pro") return "pro";
  if (normalized === "business") return "business";
  return "starter";
}

function getMaxLocations(tier: MobileTier): number {
  switch (tier) {
    case "plus": return 3;
    case "pro": return 5;
    case "business": return 10;
    default: return 2;
  }
}

export function usePlan() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [tier, setTier] = useState<MobileTier>("starter");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setTier("starter");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) setTier("starter");
          return;
        }

        const res = await fetch(`${API_BASE}/api/mobile/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (!cancelled) setTier("starter");
          return;
        }

        const data = await res.json();
        if (!cancelled) setTier(parseTier(data?.tier));
      } catch {
        if (!cancelled) setTier("starter");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isLoaded]);

  return {
    tier,
    maxLocations: getMaxLocations(tier),
    isProOrHigher: tier === "pro" || tier === "business",
  };
}
