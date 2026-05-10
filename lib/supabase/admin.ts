import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requiredEnv } from "@/lib/env";

export function getSupabaseAdminClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
