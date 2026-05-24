import { useEffect, useState } from "react";
import { getMaxLocationsForTier, type Tier } from "@shared/tier-limits";
import { useSafeAuth } from "@/src/auth";
import { API_BASE } from "../services/api";

function parseTier(value?: string): Tier {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "plus") return "plus";
  if (normalized === "pro") return "pro";
  if (normalized === "business") return "business";
  return "starter";
}

export function usePlan() {
  const { getToken, isSignedIn, isLoaded } = useSafeAuth();
  const [tier, setTier] = useState<Tier>("starter");

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
  }, [isSignedIn, isLoaded, getToken]);

  return {
    tier,
    maxLocations: getMaxLocationsForTier(tier),
    isProOrHigher: tier === "pro" || tier === "business",
  };
}
