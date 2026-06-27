import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

type AdminRoleName = "superadmin" | "manager" | "viewer";

const AdminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  full_name: z.string().nullable(),
  is_active: z.boolean(),
  roles: z.array(z.enum(["superadmin", "manager", "viewer"])),
  created_at: z.string(),
  last_login_at: z.string().nullable(),
});

const AdminUserListSchema = z.object({ users: z.array(AdminUserSchema) });

export const listAdminUsers = createServerFn({ method: "GET" }).handler(async () => {
  const [{ data: users, error: usersErr }, { data: roles, error: rolesErr }] = await Promise.all([
    supabaseAdmin
      .schema("admin")
      .from("users")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin.schema("admin").from("user_roles").select("user_id, role"),
  ]);

  if (usersErr) throw usersErr;
  if (rolesErr) throw rolesErr;

  const rolesByUser = new Map<string, AdminRoleName[]>();
  for (const r of roles ?? []) {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role as AdminRoleName);
    rolesByUser.set(r.user_id, arr);
  }

  return AdminUserListSchema.parse({
    users: (users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name ?? null,
      is_active: u.is_active,
      roles: rolesByUser.get(u.id) ?? [],
      created_at: u.created_at,
      last_login_at: u.last_login_at ?? null,
    })),
  });
});

const InviteSchema = z.object({
  email: z.string().email().max(255),
  full_name: z.string().trim().min(2).max(120),
  role: z.enum(["superadmin", "manager", "viewer"]).default("viewer"),
});

export const inviteAdmin = createServerFn({ method: "POST" })
  .validator(InviteSchema)
  .handler(async ({ data }) => {
    const tempPassword = crypto.randomUUID();

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

    if (createErr || !created?.user) {
      throw new Error(createErr?.message ?? "Failed to create user");
    }
    const userId = created.user.id;

    const { error: profileErr } = await supabaseAdmin.schema("admin").from("users").upsert({
      id: userId,
      email: data.email.toLowerCase(),
      full_name: data.full_name,
      is_active: true,
    });

    if (profileErr) throw profileErr;

    const { error: roleErr } = await supabaseAdmin
      .schema("admin")
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });

    if (roleErr) throw roleErr;

    return { ok: true as const, user_id: userId };
  });

const SetActiveSchema = z.object({
  user_id: z.string().uuid(),
  is_active: z.boolean(),
});

export const setAdminActive = createServerFn({ method: "POST" })
  .validator(SetActiveSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .schema("admin")
      .from("users")
      .update({ is_active: data.is_active })
      .eq("id", data.user_id);
    if (error) throw error;
    return { ok: true as const };
  });

const UpdateRolesSchema = z.object({
  user_id: z.string().uuid(),
  roles: z.array(z.enum(["superadmin", "manager", "viewer"])).min(1),
});

export const updateAdminRoles = createServerFn({ method: "POST" })
  .validator(UpdateRolesSchema)
  .handler(async ({ data }) => {
    const { error: delErr } = await supabaseAdmin
      .schema("admin")
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id);
    if (delErr) throw delErr;

    if (data.roles.length > 0) {
      const rows = data.roles.map((role) => ({ user_id: data.user_id, role }));
      const { error: insErr } = await supabaseAdmin.schema("admin").from("user_roles").insert(rows);
      if (insErr) throw insErr;
    }

    return { ok: true as const };
  });

export type AdminPanelUser = z.infer<typeof AdminUserSchema>;
