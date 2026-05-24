import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createLocationForUser,
  deleteLocationForUser,
  listLocationsForUser,
  locationFromMobileDto,
  locationToMobileDto,
} from "@/lib/db/locations";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locations = await listLocationsForUser(userId);
    return NextResponse.json(locations.map(locationToMobileDto));
  } catch (error) {
    console.error("[/api/mobile/saved/locations GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { label?: unknown; address?: unknown; lat?: unknown; lng?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { label, address, lat, lng } = body;
  if (
    typeof label !== "string" || !label.trim() ||
    typeof address !== "string" || !address.trim() ||
    (typeof lat !== "number" && typeof lat !== "string") ||
    (typeof lng !== "number" && typeof lng !== "string")
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const created = await createLocationForUser(
      userId,
      locationFromMobileDto({ label, address, lat, lng })
    );
    return NextResponse.json(locationToMobileDto(created), { status: 201 });
  } catch (error) {
    console.error("[/api/mobile/saved/locations POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const deleted = await deleteLocationForUser(userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/mobile/saved/locations DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
