import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  en_venta: "En venta",
  vendido: "Vendido",
  cancelado: "Cancelado",
  promocion: "Promoción",
  reservado: "Reservado",
  pausado: "Pausado",
};

const CarSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid().nullable(),
  year: z.number().nullable(),
  km: z.number().nullable(),
  price: z.number().nullable(),
  previous_price: z.number().nullable(),
  city: z.string().nullable(),
  color: z.string().nullable(),
  featured: z.boolean().nullable(),
  transmission: z.string().nullable(),
  fuel: z.string().nullable(),
  body: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  status_id: z.string().uuid().nullable(),
  brand_id: z.string().uuid().nullable(),
  model_id: z.string().uuid().nullable(),
  version_id: z.string().uuid().nullable(),
  car_brands: z
    .object({ id: z.string().uuid(), name: z.string() })
    .nullable()
    .optional()
    .transform((v) => (v == null ? null : { id: v.id, name: v.name })),
  car_models: z
    .object({ id: z.string().uuid(), name: z.string() })
    .nullable()
    .optional()
    .transform((v) => (v == null ? null : { id: v.id, name: v.name })),
  car_versions: z
    .object({ id: z.string().uuid(), name: z.string(), years: z.string().nullable() })
    .nullable()
    .optional()
    .transform((v) => (v == null ? null : { id: v.id, name: v.name, years: v.years })),
  car_statuses: z
    .object({ id: z.string().uuid(), name: z.string(), label: z.string() })
    .nullable()
    .optional()
    .transform((v) => (v == null ? null : { id: v.id, name: v.name, label: v.label })),
  owner: z
    .object({
      id: z.string().uuid(),
      full_name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

const CarListSchema = z.object({
  cars: z.array(CarSchema),
  total: z.number().int().nonnegative(),
});

export const listCars = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.string().uuid().optional(),
        brand_id: z.string().uuid().optional(),
        q: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const limit = data?.limit ?? 50;
    const offset = data?.offset ?? 0;
    let query = supabaseAdmin
      .from("cars")
      .select(
        `id, owner_id, year, km, price, previous_price, city, color, featured, transmission, fuel, body, created_at, updated_at, status_id, brand_id, model_id, version_id,
         car_brands:brand_id(id, name),
         car_models:model_id(id, name),
         car_versions:version_id(id, name, years),
         car_statuses:status_id(id, name, label)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (data?.status) query = query.eq("status_id", data.status);
    if (data?.brand_id) query = query.eq("brand_id", data.brand_id);
    if (data?.q) query = query.ilike("description", `%${data.q}%`);
    const { data: cars, error, count } = await query;
    if (error) throw error;

    const ownerIds = [...new Set((cars ?? []).map((c) => c.owner_id).filter(Boolean))] as string[];
    type OwnerInfo = { id: string; full_name: string | null; email: string | null };
    let ownerMap = new Map<string, OwnerInfo>();
    if (ownerIds.length > 0) {
      const [profilesRes, authRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name").in("id", ownerIds),
        supabaseAdmin.auth.admin.listUsers(),
      ]);
      for (const p of profilesRes.data ?? []) {
        ownerMap.set(p.id, { id: p.id, full_name: p.full_name, email: null });
      }
      for (const u of authRes.data?.users ?? []) {
        if (ownerIds.includes(u.id)) {
          const entry = ownerMap.get(u.id) ?? { id: u.id, full_name: null, email: null };
          entry.email = u.email ?? null;
          ownerMap.set(u.id, entry);
        }
      }
    }

    const enriched = (cars ?? []).map((row) => ({
      ...row,
      price: row.price != null ? Number(row.price) : null,
      previous_price: (row as any).previous_price != null ? Number((row as any).previous_price) : null,
      year: row.year != null ? Number(row.year) : null,
      km: row.km != null ? Number(row.km) : null,
      owner: row.owner_id ? (ownerMap.get(row.owner_id) ?? null) : null,
    }));

    return CarListSchema.parse({ cars: enriched, total: count ?? 0 });
  });

export const updateCar = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status_id: z.string().uuid().optional(),
      featured: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.status_id !== undefined) updates.status_id = data.status_id;
    if (data.featured !== undefined) updates.featured = data.featured;
    const { data: car, error } = await supabaseAdmin
      .from("cars")
      .update(updates)
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!car) throw new Error("Car not found");
    return { ok: true as const, id: car.id };
  });

export type AdminCar = z.infer<typeof CarSchema>;
