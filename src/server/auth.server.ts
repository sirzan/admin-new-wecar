// Server-side session helper.
// Used from `beforeLoad` route guards to read the current Supabase
// session from the request cookies. The browser client cannot be
// called from the server, so we use the @supabase/ssr createServerClient
// pattern that reads cookies off the incoming request.

import { getCookies, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getEnvOrThrow(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "[auth.server] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY on the server.",
    );
  }
  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}

export function getServerSupabase() {
  const { url, key } = getEnvOrThrow();
  const cookieJar = getCookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return Object.entries(cookieJar).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options);
        }
      },
    },
  });
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[auth.server] getSession error:", error.message);
      return null;
    }
    return data.session ?? null;
  } catch (err) {
    console.warn("[auth.server] failed to construct client:", err);
    return null;
  }
}

export function clearServerAuthCookies(): void {
  const names = [
    "sb-access-token",
    "sb-refresh-token",
    "supabase-auth-token",
  ];
  for (const name of names) {
    try {
      deleteCookie(name);
    } catch {
      // ignore
    }
  }
}

// Suppress unused-import warning when consumers don't clear cookies yet.
export { deleteCookie };
