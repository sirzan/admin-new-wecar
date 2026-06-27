import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const UserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  didit_status: z.string().nullable(),
  email: z.string().nullable(),
  is_admin: z.boolean(),
});

const UserListSchema = z.object({
  users: z.array(UserSchema),
  total: z.number().int().nonnegative(),
});

export const listUsers = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        q: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const { getServerSession } = await import("@/server/auth.server");
    const session = await getServerSession();
    const _email = session?.user?.email;
    if (!_email) throw new Error("Not authenticated");

    const limit = data?.limit ?? 50;
    const offset = data?.offset ?? 0;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, city, avatar_url, created_at, didit_status", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (data?.q) {
      const search = data.q.toLowerCase();
      query = query.or(`full_name.ilike.%${search}%,city.ilike.%${search}%`);
    }
    const { data: profiles, error, count } = await query;
    if (error) throw error;

    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
      page: Math.floor(offset / limit) + 1,
      perPage: limit,
    });
    const emailById = new Map<string, string>();
    for (const u of listData?.users ?? []) {
      if (u.email && u.id) emailById.set(u.id, u.email);
    }

    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");
    const adminIds = new Set((roleRows ?? []).map((r) => r.user_id));

    const users = (profiles ?? []).map((row) => ({
      ...row,
      email: emailById.get(row.id) ?? null,
      is_admin: adminIds.has(row.id),
    }));

    return UserListSchema.parse({ users, total: count ?? 0 });
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ user_id: z.string().uuid(), is_admin: z.boolean() }))
  .handler(async ({ data }) => {
    const { getServerSession } = await import("@/server/auth.server");
    const session = await getServerSession();
    const _email = session?.user?.email;
    if (!_email) throw new Error("Not authenticated");

    if (data.is_admin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", "admin");
      if (error) throw error;
    }

    return { ok: true as const, user_id: data.user_id, is_admin: data.is_admin };
  });

export type AdminUser = z.infer<typeof UserSchema>;
