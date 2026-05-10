import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

/**
 * Service-role client for Edge Functions (bypasses RLS).
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase runtime.
 */
export function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in Edge environment");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
