/**
 * Mobile geocode — delegates to geocodeLocationAction (actions/geocoding-test.ts):
 * LocationIQ primary, Nominatim fallback. Matches web meet-me-halfway form geocoding.
 */
import { NextResponse } from "next/server";
import { geocodeLocationAction } from "@/actions/geocoding-test";
import { getMobileAuthContext } from "@/lib/auth/mobile-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { userId } = await getMobileAuthContext();
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
    const address = typeof body?.address === "string" ? body.address.trim() : "";
    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const result = await geocodeLocationAction(address);
    if (!result.isSuccess || !result.data) {
      return NextResponse.json(
        { error: result.message || "Geocoding failed" },
        { status: 400 }
      );
    }

    const lat = parseFloat(result.data.lat);
    const lng = parseFloat(result.data.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Invalid geocode result" }, { status: 500 });
    }

    return NextResponse.json({
      lat,
      lng,
      displayName: result.data.display_name,
    });
  } catch (error) {
    console.error("[Mobile Geocode API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
