import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const VersionSchema = z.object({
  id: z.string().uuid(),
  model_id: z.string().uuid(),
  name: z.string(),
  years: z.string().nullable(),
  created_at: z.string(),
  car_models: z
    .object({
      name: z.string(),
      car_brands: z.object({ name: z.string() }).nullable(),
    })
    .nullable()
    .optional()
    .transform((v) =>
      v == null ? null : { name: v.name, brand_name: v.car_brands?.name ?? null },
    ),
});

const VersionListSchema = z.object({ versions: z.array(VersionSchema) });
const VersionItemSchema = z.object({ version: VersionSchema });

export const listVersions = createServerFn({ method: "GET" })
  .validator(z.object({ modelId: z.string().uuid().optional() }).optional())
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("car_versions")
      .select("id, model_id, name, years, created_at, car_models(name, car_brands(name))")
      .order("name", { ascending: true });
    if (data?.modelId) query = query.eq("model_id", data.modelId);
    const { data: versions, error } = await query;
    if (error) throw error;
    return VersionListSchema.parse({ versions: versions ?? [] });
  });

export const createVersion = createServerFn({ method: "POST" })
  .validator(
    z.object({
      model_id: z.string().uuid(),
      name: z.string().min(1).max(120),
      years: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { data: version, error } = await supabaseAdmin
      .from("car_versions")
      .insert({ model_id: data.model_id, name: data.name, years: data.years ?? null })
      .select("id, model_id, name, years, created_at")
      .single();
    if (error) throw error;
    return VersionItemSchema.parse({ version });
  });

export const updateVersion = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(120).optional(),
      years: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.years !== undefined) updates.years = data.years;
    const { data: version, error } = await supabaseAdmin
      .from("car_versions")
      .update(updates)
      .eq("id", data.id)
      .select("id, model_id, name, years, created_at")
      .maybeSingle();
    if (error) throw error;
    if (!version) throw new Error("Version not found");
    return VersionItemSchema.parse({ version });
  });

export const deleteVersion = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("car_versions").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export type Version = z.infer<typeof VersionSchema>;
