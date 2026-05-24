import { NextResponse } from "next/server";
import { getTravelTimeMatrixAction } from "@/actions/ors-actions";
import { getTrafficMatrixHereAction } from "@/app/actions/here-actions";
import { getMobileAuthContext } from "@/lib/auth/mobile-auth";
import { rateLimit } from "@/lib/rate-limit";

type Coord = { lat: number; lng: number };

function isValidCoord(value: unknown): value is Coord {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return typeof c.lat === "number" && typeof c.lng === "number" && Number.isFinite(c.lat) && Number.isFinite(c.lng);
}

export async function POST(request: Request) {
  try {
    const { userId, tier } = await getMobileAuthContext();
    const rateLimitType = userId ? "authenticated" : "anonymous";
    const limiter = await rateLimit({
      type: rateLimitType,
      identifier: userId ?? undefined,
    });
    if (!limiter.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit: limiter.limit,
          remaining: limiter.remaining,
          reset: new Date(limiter.reset * 1000).toISOString(),
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const originsRaw = Array.isArray(body?.origins) ? body.origins : [];
    const destinationsRaw = Array.isArray(body?.destinations) ? body.destinations : [];

    if (!originsRaw.every(isValidCoord) || !destinationsRaw.every(isValidCoord)) {
      return NextResponse.json(
        { error: "origins and destinations must be arrays of { lat, lng }" },
        { status: 400 }
      );
    }
    const origins: Coord[] = originsRaw;
    const destinations: Coord[] = destinationsRaw;

    if (origins.length === 0 || destinations.length === 0) {
      return NextResponse.json(
        { error: "origins and destinations must be non-empty" },
        { status: 400 }
      );
    }

    const useHere = tier === "pro" || tier === "business";

    if (useHere) {
      const hereResult = await getTrafficMatrixHereAction({
        origins,
        destinations,
      });

      if (!hereResult.success || !hereResult.data) {
        return NextResponse.json(
          { error: hereResult.error || "HERE matrix calculation failed" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        travelTimes: hereResult.data.travelTimes,
        distances: hereResult.data.distances,
        provider: "here",
      });
    }

    const allCoords = [...origins, ...destinations];
    const coordinates = allCoords.map((c) => `${c.lng},${c.lat}`).join(";");
    const sources = origins.map((_, idx) => idx).join(";");
    const destinationsIndices = destinations
      .map((_, idx) => origins.length + idx)
      .join(";");

    const orsResult = await getTravelTimeMatrixAction(
      coordinates,
      sources,
      destinationsIndices
    );

    if (!orsResult.isSuccess || !orsResult.data) {
      return NextResponse.json(
        { error: orsResult.message || "Matrix calculation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      travelTimes: orsResult.data.durations,
      distances: orsResult.data.distances,
      provider: "ors",
    });
  } catch (error) {
    console.error("[Mobile Matrix API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
