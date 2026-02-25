import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { locationsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locations = await db
      .select({
        id: locationsTable.id,
        label: locationsTable.name,
        address: locationsTable.address,
        lat: locationsTable.latitude,
        lng: locationsTable.longitude,
        createdAt: locationsTable.createdAt,
      })
      .from(locationsTable)
      .where(eq(locationsTable.userId, userId))
      .orderBy(locationsTable.createdAt);

    return NextResponse.json(locations);
  } catch (error) {
    console.error("[/api/mobile/saved/locations GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
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
    const [created] = await db
      .insert(locationsTable)
      .values({
        userId,
        name: String(label).trim(),
        address: String(address).trim(),
        latitude: String(lat),
        longitude: String(lng),
      })
      .returning({
        id: locationsTable.id,
        label: locationsTable.name,
        address: locationsTable.address,
        lat: locationsTable.latitude,
        lng: locationsTable.longitude,
        createdAt: locationsTable.createdAt,
      });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[/api/mobile/saved/locations POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const existing = await db
      .select({ id: locationsTable.id, userId: locationsTable.userId })
      .from(locationsTable)
      .where(eq(locationsTable.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing[0].userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .delete(locationsTable)
      .where(and(eq(locationsTable.id, id), eq(locationsTable.userId, userId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/mobile/saved/locations DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
