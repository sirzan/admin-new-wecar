import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.string(),
});

const BrandListSchema = z.object({ brands: z.array(BrandSchema) });
const BrandItemSchema = z.object({ brand: BrandSchema });
const OkSchema = z.object({ ok: z.literal(true) });

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("car_brands")
    .select("id, name, created_at")
    .order("name", { ascending: true });
  if (error) throw error;
  return BrandListSchema.parse({ brands: data ?? [] });
});

export const createBrand = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string().min(2).max(80) }))
  .handler(async ({ data }) => {
    const { data: brand, error } = await supabaseAdmin
      .from("car_brands")
      .insert({ name: data.name })
      .select("id, name, created_at")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("A brand with that name already exists");
      throw error;
    }
    return BrandItemSchema.parse({ brand });
  });

export const updateBrand = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), name: z.string().min(2).max(80) }))
  .handler(async ({ data }) => {
    const { data: brand, error } = await supabaseAdmin
      .from("car_brands")
      .update({ name: data.name })
      .eq("id", data.id)
      .select("id, name, created_at")
      .maybeSingle();
    if (error) throw error;
    if (!brand) throw new Error("Brand not found");
    return BrandItemSchema.parse({ brand });
  });

export const deleteBrand = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("car_brands").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export type Brand = z.infer<typeof BrandSchema>;
export const BrandDeleteResultSchema = OkSchema;
