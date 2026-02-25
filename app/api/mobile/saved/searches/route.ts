import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { searchesTable } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

type LocationEntry = { address: string; lat: number; lng: number };

function parseLocations(raw: unknown): LocationEntry[] | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const result: LocationEntry[] = [];
  for (const item of raw) {
    if (
      typeof item !== "object" || item === null ||
      typeof (item as any).address !== "string" ||
      (typeof (item as any).lat !== "number" && typeof (item as any).lat !== "string") ||
      (typeof (item as any).lng !== "number" && typeof (item as any).lng !== "string")
    ) {
      return null;
    }
    result.push({
      address: (item as any).address,
      lat: Number((item as any).lat),
      lng: Number((item as any).lng),
    });
  }
  return result;
}

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select({
        id: searchesTable.id,
        startLocationAddress: searchesTable.startLocationAddress,
        startLocationLat: searchesTable.startLocationLat,
        startLocationLng: searchesTable.startLocationLng,
        endLocationAddress: searchesTable.endLocationAddress,
        endLocationLat: searchesTable.endLocationLat,
        endLocationLng: searchesTable.endLocationLng,
        searchMetadata: searchesTable.searchMetadata,
        originCount: searchesTable.originCount,
        createdAt: searchesTable.createdAt,
      })
      .from(searchesTable)
      .where(eq(searchesTable.userId, userId))
      .orderBy(desc(searchesTable.createdAt))
      .limit(50);

    const searches = rows.map((row) => {
      // Reconstruct the locations array from legacy 2-origin fields
      let locations: LocationEntry[] = [];
      if (
        row.startLocationAddress && row.startLocationLat && row.startLocationLng &&
        row.endLocationAddress && row.endLocationLat && row.endLocationLng
      ) {
        locations = [
          { address: row.startLocationAddress, lat: Number(row.startLocationLat), lng: Number(row.startLocationLng) },
          { address: row.endLocationAddress, lat: Number(row.endLocationLat), lng: Number(row.endLocationLng) },
        ];
      } else if (row.searchMetadata && Array.isArray((row.searchMetadata as any).locations)) {
        locations = (row.searchMetadata as any).locations;
      }
      return { id: row.id, locations, createdAt: row.createdAt };
    });

    return NextResponse.json(searches);
  } catch (error) {
    console.error("[/api/mobile/saved/searches GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { locations?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const locations = parseLocations(body.locations);
  if (!locations) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(searchesTable)
      .values({
        userId,
        originCount: locations.length,
        startLocationAddress: locations[0].address,
        startLocationLat: String(locations[0].lat),
        startLocationLng: String(locations[0].lng),
        endLocationAddress: locations[1].address,
        endLocationLat: String(locations[1].lat),
        endLocationLng: String(locations[1].lng),
        midpointLat: "0",
        midpointLng: "0",
        searchMetadata: { locations },
      })
      .returning({
        id: searchesTable.id,
        createdAt: searchesTable.createdAt,
      });

    return NextResponse.json({ id: created.id, locations, createdAt: created.createdAt }, { status: 201 });
  } catch (error) {
    console.error("[/api/mobile/saved/searches POST] Error:", error);
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
      .select({ id: searchesTable.id, userId: searchesTable.userId })
      .from(searchesTable)
      .where(eq(searchesTable.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing[0].userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .delete(searchesTable)
      .where(and(eq(searchesTable.id, id), eq(searchesTable.userId, userId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/mobile/saved/searches DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
