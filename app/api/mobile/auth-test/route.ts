/**
 * Temporary Bearer token verification endpoint.
 * Used to confirm that auth() reads the Clerk JWT from mobile callers.
 * Remove this file once Phase 2 Bearer token verification is confirmed.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();
  return NextResponse.json({ userId, authenticated: !!userId });
}
