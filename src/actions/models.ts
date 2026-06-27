import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const ModelSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  name: z.string(),
  created_at: z.string(),
  car_brands: z
    .object({ name: z.string() })
    .nullable()
    .optional()
    .transform((v) => (v == null ? null : v.name)),
});

const ModelListSchema = z.object({ models: z.array(ModelSchema) });
const ModelItemSchema = z.object({ model: ModelSchema });

export const listModels = createServerFn({ method: "GET" })
  .validator(z.object({ brandId: z.string().uuid().optional() }).optional())
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("car_models")
      .select("id, brand_id, name, created_at, car_brands(name)")
      .order("name", { ascending: true });
    if (data?.brandId) query = query.eq("brand_id", data.brandId);
    const { data: models, error } = await query;
    if (error) throw error;
    return ModelListSchema.parse({ models: models ?? [] });
  });

export const createModel = createServerFn({ method: "POST" })
  .validator(z.object({ brand_id: z.string().uuid(), name: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    const { data: model, error } = await supabaseAdmin
      .from("car_models")
      .insert({ brand_id: data.brand_id, name: data.name })
      .select("id, brand_id, name, created_at")
      .single();
    if (error) throw error;
    return ModelItemSchema.parse({ model });
  });

export const updateModel = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), name: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    const { data: model, error } = await supabaseAdmin
      .from("car_models")
      .update({ name: data.name })
      .eq("id", data.id)
      .select("id, brand_id, name, created_at")
      .maybeSingle();
    if (error) throw error;
    if (!model) throw new Error("Model not found");
    return ModelItemSchema.parse({ model });
  });

export const deleteModel = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("car_models").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export type Model = z.infer<typeof ModelSchema>;
