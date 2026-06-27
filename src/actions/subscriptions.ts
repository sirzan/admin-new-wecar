import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const PlanJoinSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  duration: z.string(),
  duration_weeks: z.number(),
  max_cars: z.number(),
  highlight: z.boolean(),
  features: z.array(z.any()),
});

const CarJoinSchema = z.object({
  id: z.string().uuid(),
  year: z.number().nullable(),
  km: z.number().nullable(),
  price: z.number().nullable(),
  city: z.string().nullable(),
  car_brands: z
    .object({ id: z.string().uuid(), name: z.string() })
    .nullable()
    .optional(),
  car_models: z
    .object({ id: z.string().uuid(), name: z.string() })
    .nullable()
    .optional(),
});

const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  car_id: z.string().uuid(),
  plan_id: z.string(),
  status: z.string(),
  billing_cycle: z.string(),
  stripe_subscription_id: z.string().nullable(),
  current_period_start: z.string().nullable(),
  current_period_end: z.string().nullable(),
  created_at: z.string(),
  plan: PlanJoinSchema.nullable().optional(),
  car: CarJoinSchema.nullable().optional(),
  profiles: z
    .object({ id: z.string().uuid(), full_name: z.string().nullable(), avatar_url: z.string().nullable() })
    .nullable()
    .optional(),
  email: z.string().nullable().optional(),
});

const SubscriptionListSchema = z.object({
  subscriptions: z.array(SubscriptionSchema),
  total: z.number().int().nonnegative(),
});

const SubscriptionDetailSchema = z.object({ subscription: SubscriptionSchema });

export const listSubscriptions = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        q: z.string().optional(),
        status: z.string().optional(),
        plan_id: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const limit = data?.limit ?? 50;
    const offset = data?.offset ?? 0;
    let query = supabaseAdmin
      .from("subscriptions")
      .select(
        `id, user_id, car_id, plan_id, status, billing_cycle, stripe_subscription_id, current_period_start, current_period_end, created_at,
         plan:plan_id(id, name, price, duration, duration_weeks, max_cars, highlight, features),
         car:car_id(id, year, km, price, city,
           car_brands:brand_id(id, name),
           car_models:model_id(id, name)
         )`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (data?.status) query = query.eq("status", data.status);
    if (data?.plan_id) query = query.eq("plan_id", data.plan_id);

    const { data: raw, error, count } = await query;
    if (error) throw error;

    const rows = (raw ?? []) as any[];
    const userIds = [...new Set(rows.map((s) => s.user_id).filter(Boolean))] as string[];
    let profileMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null; email: string | null }>();
    if (userIds.length > 0) {
      const [profilesRes, authRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name, avatar_url").in("id", userIds),
        supabaseAdmin.auth.admin.listUsers(),
      ]);
      for (const p of (profilesRes.data ?? []) as any[]) {
        profileMap.set(p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, email: null });
      }
      for (const u of authRes.data?.users ?? []) {
        const entry = profileMap.get(u.id);
        if (entry) entry.email = u.email ?? null;
      }
    }

    const enriched = rows.map((row) => ({
      ...row,
      profiles: row.user_id ? (profileMap.get(row.user_id) ?? null) : null,
      email: row.user_id ? (profileMap.get(row.user_id)?.email ?? null) : null,
    }));

    return SubscriptionListSchema.parse({ subscriptions: enriched, total: count ?? 0 });
  });

export const getSubscription = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: raw, error } = await supabaseAdmin
      .from("subscriptions")
      .select(
        `id, user_id, car_id, plan_id, status, billing_cycle, stripe_subscription_id, current_period_start, current_period_end, created_at,
         plan:plan_id(id, name, price, duration, duration_weeks, max_cars, highlight, features),
         car:car_id(id, year, km, price, city,
           car_brands:brand_id(id, name),
           car_models:model_id(id, name)
         )`,
      )
      .eq("id", data.id)
      .single();
    if (error) throw error;

    const row = raw as any;
    const [profileRes, authRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, avatar_url").eq("id", row.user_id).maybeSingle(),
      supabaseAdmin.auth.admin.listUsers(),
    ]);
    const profile = profileRes.data as any;
    const authUser = authRes.data?.users?.find((u) => u.id === row.user_id);

    const enriched = {
      ...row,
      profiles: profile ?? null,
      email: authUser?.email ?? null,
    };

    return SubscriptionDetailSchema.parse({ subscription: enriched });
  });

export const updateSubscriptionStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["active", "paused", "cancelled", "expired", "trialing"]),
    }),
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = { status: data.status };
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update(updates)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export type AdminSubscription = z.infer<typeof SubscriptionSchema>;
