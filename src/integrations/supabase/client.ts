// Browser-side Supabase client using @supabase/ssr so auth tokens
// are stored in cookies and accessible by server-side code.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

function createSupabaseBrowserClient() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["VITE_SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["VITE_SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message =
      `Missing Supabase env var(s): ${missing.join(", ")}. ` +
      `Run \`supabase start\` locally or configure the env in your host.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  const isSecure = typeof document !== "undefined" && document.location.protocol === "https:";

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];
        const cookies = document.cookie.split("; ").filter(Boolean);
        return cookies.map((c) => {
          const eq = c.indexOf("=");
          const name = eq > -1 ? c.slice(0, eq) : c;
          const value = eq > -1 ? c.slice(eq + 1) : "";
          return { name, value };
        });
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, string | number | boolean | undefined> }[]) {
        if (typeof document === "undefined") return;
        for (const { name, value, options } of cookiesToSet) {
          const parts: string[] = [`${name}=${value}`];
          parts.push(`Path=${options?.path ?? "/"}`);
          parts.push(`SameSite=${options?.sameSite ?? "Lax"}`);
          if (options?.secure ?? isSecure) parts.push("Secure");
          if (options?.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);
          if (options?.domain) parts.push(`Domain=${options.domain}`);
          document.cookie = parts.join("; ");
        }
      },
    },
  });
}

let _supabase: any;

export const supabase = new Proxy({} as any, {
  get(_target, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseBrowserClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
