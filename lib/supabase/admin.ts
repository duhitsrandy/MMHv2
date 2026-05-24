import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Server-only Supabase secret key (sb_secret_...). Legacy service_role JWT still accepted as fallback. */
export function getSupabaseSecretKey(): string {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set (create one in Supabase Dashboard → Settings → API Keys)"
    );
  }
  return key.trim();
}

/** Elevated Supabase client for server routes (bypasses RLS). Never use in browser or mobile. */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return createClient(url, getSupabaseSecretKey());
}
