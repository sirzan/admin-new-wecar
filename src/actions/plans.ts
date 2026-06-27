import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  duration: z.string(),
  duration_weeks: z.number(),
  max_cars: z.number(),
  highlight: z.boolean(),
  features: z.array(z.string()),
  created_at: z.string().optional(),
});

const PlanListSchema = z.object({ plans: z.array(PlanSchema) });
const PlanItemSchema = z.object({ plan: PlanSchema });

const PlanInputSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{2,40}$/),
  name: z.string().min(2).max(80),
  price: z.number().nonnegative(),
  duration: z.string().min(1).max(40),
  duration_weeks: z.number().int().positive(),
  max_cars: z.number().int().nonnegative(),
  highlight: z.boolean().default(false),
  features: z.array(z.string()).min(1),
});

const PlanUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(80).optional(),
  price: z.number().nonnegative().optional(),
  duration: z.string().min(1).max(40).optional(),
  duration_weeks: z.number().int().positive().optional(),
  max_cars: z.number().int().nonnegative().optional(),
  highlight: z.boolean().optional(),
  features: z.array(z.string()).min(1).optional(),
});

export const listPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("plans").select("*").order("price");
  if (error) throw error;
  return PlanListSchema.parse({ plans: data ?? [] });
});

export const createPlan = createServerFn({ method: "POST" })
  .validator(PlanInputSchema)
  .handler(async ({ data }) => {
    const { data: plan, error } = await supabaseAdmin
      .from("plans")
      .insert({
        id: data.id,
        name: data.name,
        price: data.price,
        duration: data.duration,
        duration_weeks: data.duration_weeks,
        max_cars: data.max_cars,
        highlight: data.highlight,
        features: data.features,
      } as any)
      .select("*")
      .single();
    if (error) throw error;
    return PlanItemSchema.parse({ plan });
  });

export const updatePlan = createServerFn({ method: "POST" })
  .validator(PlanUpdateSchema)
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.price !== undefined) updates.price = data.price;
    if (data.duration !== undefined) updates.duration = data.duration;
    if (data.duration_weeks !== undefined) updates.duration_weeks = data.duration_weeks;
    if (data.max_cars !== undefined) updates.max_cars = data.max_cars;
    if (data.highlight !== undefined) updates.highlight = data.highlight;
    if (data.features !== undefined) updates.features = data.features;
    const { data: plan, error } = await supabaseAdmin
      .from("plans")
      .update(updates as any)
      .eq("id", data.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!plan) throw new Error("Plan not found");
    return PlanItemSchema.parse({ plan });
  });

export const deletePlan = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("plans").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export type Plan = z.infer<typeof PlanSchema>;
