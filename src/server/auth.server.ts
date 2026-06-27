import { getCookies, setCookie } from "@tanstack/react-start/server";
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

export async function getServerSession() {
  const { url, key } = getEnvOrThrow();
  const allCookies = getCookies();
  const cookieEntries = Object.entries(allCookies);
  if (cookieEntries.length === 0) return null;

  const isSecure = url.startsWith("https://");

  try {
    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          return cookieEntries.map(([name, value]) => ({
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
          for (const { name, value, options } of cookiesToSet) {
            setCookie(name, value, {
              path: "/",
              sameSite: "lax",
              secure: isSecure,
              httpOnly: false,
              ...options,
            });
          }
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
