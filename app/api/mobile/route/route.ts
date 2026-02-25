import { NextResponse } from "next/server";
import { getAlternateRouteAction, getRouteAction } from "@/actions/locationiq-actions";
import { rateLimit } from "@/lib/rate-limit";

type RouteBody = {
  startLat: number | string;
  startLon: number | string;
  endLat: number | string;
  endLon: number | string;
};

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Returns the point at 50% of the total route distance (matches web app behavior). */
function distanceMidpoint(
  coords: [number, number][],
  totalDistance?: number
): { lat: number; lng: number } | null {
  if (coords.length < 2) return null;

  // Compute total distance from coords if not provided
  let total = totalDistance ?? 0;
  if (!total) {
    for (let i = 0; i < coords.length - 1; i++) {
      total += haversineMeters(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
    }
  }
  if (!total) return null;

  const target = total / 2;
  let cumulative = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    const seg = haversineMeters(lat1, lon1, lat2, lon2);
    if (cumulative + seg >= target) {
      const ratio = seg === 0 ? 0 : (target - cumulative) / seg;
      return { lat: lat1 + ratio * (lat2 - lat1), lng: lon1 + ratio * (lon2 - lon1) };
    }
    cumulative += seg;
  }
  // Fallback: last point
  const last = coords[coords.length - 1];
  return { lat: last[1], lng: last[0] };
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

    // Distance-based midpoint (50% of route distance), matching web app behavior
    const mainMidpoint = distanceMidpoint(mainRoute, mainRes.data.distance);
    const alternateMidpoint =
      alternateRoute.length > 0 && altRes.isSuccess && altRes.data
        ? distanceMidpoint(alternateRoute, altRes.data.distance)
        : null;

    return NextResponse.json({
      mainRoute,
      alternateRoute,
      mainMidpoint,
      alternateMidpoint,
    });
  } catch (error) {
    console.error("[Mobile Route API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

