import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createSearchForUser,
  deleteSearchForUser,
  listSearchesForUser,
} from "@/lib/db/searches";
import { MobileSavedSearchPostSchema } from "@/lib/schemas";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searches = await listSearchesForUser(userId, { limit: 50 });
    const payload = searches.map(({ search, locations }) => ({
      id: search.id,
      locations,
      createdAt: search.createdAt,
    }));
    return NextResponse.json(payload);
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = MobileSavedSearchPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { search, locations } = await createSearchForUser(
      userId,
      parsed.data.locations
    );
    return NextResponse.json(
      { id: search.id, locations, createdAt: search.createdAt },
      { status: 201 }
    );
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
    const deleted = await deleteSearchForUser(userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/mobile/saved/searches DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
