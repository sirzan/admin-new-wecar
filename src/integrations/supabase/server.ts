// Server-side Supabase client (service role).
// ONLY import this file from server-only contexts:
//   - createServerFn(...) handlers
//   - Edge Functions
//   - Migration scripts
// NEVER import it from React components.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let _supabaseAdmin: SupabaseClient<Database> | undefined;

function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_supabaseAdmin) return _supabaseAdmin;

  const SUPABASE_URL =
    process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SERVICE_ROLE ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
    ];
    throw new Error(
      `[Supabase admin] Missing env var(s): ${missing.join(', ')}. ` +
        `This client can only be used server-side.`,
    );
  }

  _supabaseAdmin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdmin(), prop, receiver);
  },
});
