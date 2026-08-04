import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server contexts with no user session (cron jobs).
 * Bypasses RLS — never expose to the client, never use inside a user request.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
