import { createServerFn } from "@tanstack/react-start";
import { getServerSession } from "@/server/auth.server";
import { supabaseAdmin } from "@/integrations/supabase/server";

export interface AdminProfileDTO {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  role: string | null;
}

export const getAdminProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminProfileDTO | null> => {
    const session = await getServerSession();
    if (!session?.user?.id) return null;

    const { data: row, error: userErr } = await supabaseAdmin
      .schema("admin")
      .from("users")
      .select("id, email, full_name, avatar_url, is_active")
      .eq("id", session.user.id)
      .maybeSingle();

    if (userErr) throw userErr;
    if (!row) return null;

    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .schema("admin")
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (roleErr) throw roleErr;

    return {
      id: row.id as string,
      email: row.email as string,
      full_name: (row.full_name as string | null) ?? null,
      avatar_url: (row.avatar_url as string | null) ?? null,
      is_active: row.is_active as boolean,
      role: (roleRow?.role as string | null) ?? null,
    };
  },
);
