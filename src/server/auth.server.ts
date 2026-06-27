// Server-only auth helpers. This file lives under src/server/** so the
// TanStack Start import-protection plugin guarantees it never reaches the
// client bundle. It may only be imported from createServerFn() handlers
// or other .server.ts files.

import { getCookies } from "@tanstack/react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getEnvOrThrow(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "[auth.server] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY on the server.",
    );
  }
  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}

function getSupabaseAuthCookies(): Record<string, string> {
  const all = getCookies();
  const auth: Record<string, string> = {};
  for (const [name, value] of Object.entries(all)) {
    if (name.startsWith("sb-")) {
      auth[name] = value;
    }
  }
  return auth;
}

/**
 * Returns the current Supabase session by reading cookies via
 * @supabase/ssr. Returns null if no valid session. Safe to call only
 * from server contexts (server fns, .server.ts files).
 */
export async function getServerSession() {
  const { url, key } = getEnvOrThrow();
  const cookies = getSupabaseAuthCookies();
  if (Object.keys(cookies).length === 0) return null;

  try {
    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          return Object.entries(cookies).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>,
        ) {
          void cookiesToSet;
        },
      },
    });
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session ?? null;
  } catch {
    return null;
  }
}

export const requireAdminServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getServerSession();
  if (!session) {
    throw redirect({ to: "/login" });
  }
  return { authenticated: true as const };
});

export const requireAnonServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getServerSession();
  if (session) {
    throw redirect({ to: "/dashboard" });
  }
  return { anonymous: true as const };
});
