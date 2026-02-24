import { NextResponse } from "next/server";
import { getAlternateRouteAction, getRouteAction } from "@/actions/locationiq-actions";
import { rateLimit } from "@/lib/rate-limit";

type RouteBody = {
  startLat: number | string;
  startLon: number | string;
  endLat: number | string;
  endLon: number | string;
};

function midpointFromCoordinates(coords: [number, number][]) {
  if (!coords.length) return null;
  const midIndex = Math.floor(coords.length / 2);
  const [lng, lat] = coords[midIndex];
  return { lat, lng };
}

export async function POST(request: Request) {
  try {
    const limiter = await rateLimit();
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

    const body = (await request.json()) as RouteBody;
    const startLat = String(body.startLat ?? "");
    const startLon = String(body.startLon ?? "");
    const endLat = String(body.endLat ?? "");
    const endLon = String(body.endLon ?? "");

    if (!startLat || !startLon || !endLat || !endLon) {
      return NextResponse.json({ error: "Missing route coordinates" }, { status: 400 });
    }

    const [mainRes, altRes] = await Promise.all([
      getRouteAction({ startLat, startLon, endLat, endLon }),
      getAlternateRouteAction({ startLat, startLon, endLat, endLon }),
    ]);

    if (!mainRes.isSuccess || !mainRes.data?.geometry?.coordinates) {
      return NextResponse.json(
        { error: mainRes.message || "Failed to calculate main route" },
        { status: 500 }
      );
    }

    const mainRoute = mainRes.data.geometry.coordinates as [number, number][];
    const alternateRoute = altRes.isSuccess && altRes.data?.geometry?.coordinates
      ? (altRes.data.geometry.coordinates as [number, number][])
      : [];

    return NextResponse.json({
      mainRoute,
      alternateRoute,
      mainMidpoint: midpointFromCoordinates(mainRoute),
      alternateMidpoint: midpointFromCoordinates(alternateRoute),
    });
  } catch (error) {
    console.error("[Mobile Route API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

