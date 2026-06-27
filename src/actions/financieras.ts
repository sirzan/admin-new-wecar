import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const FinancieraSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  nombre: z.string(),
  tipo: z.string(),
  logo: z.string(),
  color: z.string(),
  tasa_min: z.number(),
  tasa_max: z.number(),
  cat_min: z.number(),
  cat_max: z.number(),
  enganche_pct: z.number(),
  plazo_max: z.number(),
  score_min: z.number().nullable(),
  destacado: z.boolean(),
  aplica_para: z.string().nullable(),
  contacto: z.string().nullable(),
  notas: z.string().nullable(),
  orden: z.number(),
  activo: z.boolean(),
  created_at: z.string().optional(),
});

const FinancieraListSchema = z.object({ financieras: z.array(FinancieraSchema) });
const FinancieraItemSchema = z.object({ financiera: FinancieraSchema });

const FinancieraBaseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,60}$/),
  nombre: z.string().min(2).max(120),
  tipo: z.enum(["banco", "financiera_marca", "autofinanciamiento", "prendaria", "fintech"]),
  logo: z.string().min(1).max(20),
  color: z.string().min(1).max(120),
  tasa_min: z.number(),
  tasa_max: z.number(),
  cat_min: z.number(),
  cat_max: z.number(),
  enganche_pct: z.number().int().min(0).max(100),
  plazo_max: z.number().int().min(1),
  score_min: z.number().int().min(0).max(850).nullable().optional(),
  destacado: z.boolean().default(false),
  aplica_para: z.string().nullable().optional(),
  contacto: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
});

export const listFinancieras = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("financieras").select("*").order("orden");
  if (error) throw error;
  return FinancieraListSchema.parse({ financieras: data ?? [] });
});

export const createFinanciera = createServerFn({ method: "POST" })
  .validator(FinancieraBaseSchema)
  .handler(async ({ data }) => {
    const { data: financiera, error } = await supabaseAdmin
      .from("financieras")
      .insert(data)
      .select("*")
      .single();
    if (error) throw error;
    return FinancieraItemSchema.parse({ financiera });
  });

const FinancieraUpdateSchema = FinancieraBaseSchema.partial().extend({ id: z.string().uuid() });

export const updateFinanciera = createServerFn({ method: "POST" })
  .validator(FinancieraUpdateSchema)
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    const { data: financiera, error } = await supabaseAdmin
      .from("financieras")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!financiera) throw new Error("Financiera not found");
    return FinancieraItemSchema.parse({ financiera });
  });

export const deleteFinanciera = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("financieras").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export type Financiera = z.infer<typeof FinancieraSchema>;
