import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/db/db'
import { profilesTable } from '@/db/schema/profiles-schema'
import { NextResponse } from 'next/server'

// This secret comes from your Clerk Dashboard -> Webhooks -> Endpoint signing secret
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  console.log('[Webhook Clerk] Received webhook event');

  if (!WEBHOOK_SECRET) {
    console.error('[Webhook Clerk] CLERK_WEBHOOK_SECRET not set in environment variables.');
    return NextResponse.json({ error: 'Server configuration error: Webhook secret missing.' }, { status: 500 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[Webhook Clerk] Error: Missing svix headers');
    return NextResponse.json({ error: 'Missing required webhook signature headers.' }, { status: 400 });
  }

  // Get the body
  let payload: WebhookEvent;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('[Webhook Clerk] Error parsing request body:', err);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err: any) {
    console.error('[Webhook Clerk] Error verifying webhook:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`[Webhook Clerk] Verified event type: ${eventType}, ID: ${id}`);

  // Handle the 'user.created' event
  if (eventType === 'user.created') {
    const userId = evt.data.id;
    // Optional: Extract email, username, etc. if needed
    // const email = evt.data.email_addresses?.[0]?.email_address;
    // const username = evt.data.username;

    console.log(`[Webhook Clerk] User created event for userId: ${userId}`);

    try {
      // Check if profile already exists (defensive check, should ideally not happen for user.created)
      const existingProfile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.userId, userId),
        columns: { userId: true }
      });

      if (existingProfile) {
        console.warn(`[Webhook Clerk] Profile already exists for userId: ${userId}. Skipping creation.`);
        return NextResponse.json({ message: 'Profile already exists.' }, { status: 200 }); // Acknowledge event
      }

      // Insert the new user profile into the database
      await db.insert(profilesTable).values({
        userId: userId,
        membership: 'free', // Default to free plan
        // Add other default fields if needed
      });

      console.log(`[Webhook Clerk] Successfully created profile for userId: ${userId}`);
      return NextResponse.json({ message: 'User profile created successfully.' }, { status: 201 });

    } catch (dbError) {
      console.error(`[Webhook Clerk] Database error creating profile for userId ${userId}:`, dbError);
      return NextResponse.json({ error: 'Database error occurred.' }, { status: 500 });
    }
  }

  // Handle other event types if needed in the future (e.g., user.updated, user.deleted)
  // if (eventType === 'user.updated') { ... }
  // if (eventType === 'user.deleted') { ... }

  console.log(`[Webhook Clerk] Received unhandled event type: ${eventType}`);
  return NextResponse.json({ message: 'Webhook received, but no action taken for this event type.' }, { status: 200 });
} 