import { useCallback, useEffect, useState } from "react";
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

async function fetchTierFromProfile(
  getToken: () => Promise<string | null>
): Promise<Tier> {
  const token = await getToken();
  if (!token) return "starter";

  const res = await fetch(`${API_BASE}/api/mobile/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return "starter";

  const data = await res.json();
  return parseTier(data?.tier);
}

export function usePlan() {
  const { getToken, isSignedIn, isLoaded } = useSafeAuth();
  const [tier, setTier] = useState<Tier>("starter");

  const refresh = useCallback(async (): Promise<Tier> => {
    if (!isSignedIn) {
      setTier("starter");
      return "starter";
    }
    try {
      const next = await fetchTierFromProfile(getToken);
      setTier(next);
      return next;
    } catch {
      setTier("starter");
      return "starter";
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setTier("starter");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const next = await fetchTierFromProfile(getToken);
        if (!cancelled) setTier(next);
      } catch {
        if (!cancelled) setTier("starter");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isLoaded, getToken]);

  const pollUntilTierUpdates = useCallback(
    async (options?: {
      previousTier?: Tier;
      targetTier?: Tier;
      timeoutMs?: number;
      intervalMs?: number;
    }): Promise<Tier> => {
      const {
        previousTier = tier,
        targetTier,
        timeoutMs = 15_000,
        intervalMs = 2_000,
      } = options ?? {};

      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        const next = await refresh();
        if (targetTier && next === targetTier) return next;
        if (!targetTier && next !== previousTier) return next;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      return refresh();
    },
    [tier, refresh]
  );

  return {
    tier,
    maxLocations: getMaxLocationsForTier(tier),
    isProOrHigher: tier === "pro" || tier === "business",
    refresh,
    pollUntilTierUpdates,
  };
}
