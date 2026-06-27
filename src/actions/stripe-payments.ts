import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const PaymentSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  car_id: z.string().uuid(),
  plan_id: z.string(),
  status: z.string(),
  billing_cycle: z.string(),
  plan: z
    .object({ id: z.string(), name: z.string(), price: z.number() })
    .nullable()
    .optional(),
  car: z
    .object({
      id: z.string().uuid(),
      car_brands: z.object({ id: z.string().uuid(), name: z.string() }).nullable().optional(),
      car_models: z.object({ id: z.string().uuid(), name: z.string() }).nullable().optional(),
    })
    .nullable()
    .optional(),
});

const StripePaymentSchema = z.object({
  id: z.string().uuid(),
  subscription_id: z.string().uuid(),
  stripe_payment_intent_id: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  receipt_url: z.string().nullable(),
  created_at: z.string(),
  subscription: PaymentSubscriptionSchema.nullable().optional(),
  profiles: z
    .object({ id: z.string().uuid(), full_name: z.string().nullable() })
    .nullable()
    .optional(),
  email: z.string().nullable().optional(),
});

const StripePaymentListSchema = z.object({
  payments: z.array(StripePaymentSchema),
  total: z.number().int().nonnegative(),
});

const StripePaymentDetailSchema = z.object({ payment: StripePaymentSchema });

export const listStripePayments = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.string().optional(),
        subscription_id: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const limit = data?.limit ?? 50;
    const offset = data?.offset ?? 0;
    let query = supabaseAdmin
      .from("stripe_payments")
      .select(
        `id, subscription_id, stripe_payment_intent_id, amount, currency, status, receipt_url, created_at,
         subscription:subscription_id(id, user_id, car_id, plan_id, status, billing_cycle,
           plan:plan_id(id, name, price),
           car:car_id(id,
             car_brands:brand_id(id, name),
             car_models:model_id(id, name)
           )
         )`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (data?.status) query = query.eq("status", data.status);
    if (data?.subscription_id) query = query.eq("subscription_id", data.subscription_id);

    const { data: raw, error, count } = await query;
    if (error) throw error;

    const rows = (raw ?? []) as any[];
    const userIds = [...new Set(rows.map((r) => r.subscription?.user_id).filter(Boolean))] as string[];
    let profileMap = new Map<string, { id: string; full_name: string | null; email: string | null }>();
    if (userIds.length > 0) {
      const [profilesRes, authRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds),
        supabaseAdmin.auth.admin.listUsers(),
      ]);
      for (const p of (profilesRes.data ?? []) as any[]) {
        profileMap.set(p.id, { id: p.id, full_name: p.full_name, email: null });
      }
      for (const u of authRes.data?.users ?? []) {
        const entry = profileMap.get(u.id);
        if (entry) entry.email = u.email ?? null;
      }
    }

    const enriched = rows.map((row) => {
      const userId = row.subscription?.user_id;
      return {
        ...row,
        amount: Number(row.amount),
        profiles: userId ? (profileMap.get(userId) ?? null) : null,
        email: userId ? (profileMap.get(userId)?.email ?? null) : null,
      };
    });

    return StripePaymentListSchema.parse({ payments: enriched, total: count ?? 0 });
  });

export const getStripePayment = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: raw, error } = await supabaseAdmin
      .from("stripe_payments")
      .select(
        `id, subscription_id, stripe_payment_intent_id, amount, currency, status, receipt_url, created_at,
         subscription:subscription_id(id, user_id, car_id, plan_id, status, billing_cycle,
           plan:plan_id(id, name, price),
           car:car_id(id,
             car_brands:brand_id(id, name),
             car_models:model_id(id, name)
           )
         )`,
      )
      .eq("id", data.id)
      .single();
    if (error) throw error;

    const row = raw as any;
    const userId = row.subscription?.user_id;
    let profile = null;
    let email = null;
    if (userId) {
      const [profileRes, authRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name").eq("id", userId).maybeSingle(),
        supabaseAdmin.auth.admin.listUsers(),
      ]);
      profile = (profileRes.data as any) ?? null;
      email = authRes.data?.users?.find((u) => u.id === userId)?.email ?? null;
    }

    const enriched = { ...row, amount: Number(row.amount), profiles: profile, email };

    return StripePaymentDetailSchema.parse({ payment: enriched });
  });

export type AdminStripePayment = z.infer<typeof StripePaymentSchema>;
