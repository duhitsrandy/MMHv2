import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This secret comes from your Clerk Dashboard -> Webhooks -> Endpoint signing secret
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    console.log(`[Webhook Clerk] User created event for userId: ${userId}`);

    try {
      // Check if profile already exists using Supabase admin client
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (existingProfile) {
        console.warn(`[Webhook Clerk] Profile already exists for userId: ${userId}. Skipping creation.`);
        return NextResponse.json({ message: 'Profile already exists.' }, { status: 200 });
      }

      // Extract and save additional fields
      const email = evt.data.email_addresses?.[0]?.email_address || null;
      const username = evt.data.username || null;

      // Insert profile using Supabase admin client (bypasses RLS)
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          email: email,
          username: username,
          membership: 'starter',
        });

      if (insertError) {
        throw insertError;
      }

      console.log(`[Webhook Clerk] Successfully created profile for userId: ${userId} with email and username`);
      return NextResponse.json({ message: 'User profile created successfully.' }, { status: 201 });
    } catch (dbError) {
      console.error(`[Webhook Clerk] Database error creating profile for userId ${userId}:`, dbError);
      return NextResponse.json({ error: 'Database error occurred.' }, { status: 500 });
    }
  }

  console.log(`[Webhook Clerk] Unhandled event type: ${eventType}`);
  return NextResponse.json({ error: 'Unhandled event type.' }, { status: 400 });
}