import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const CarMiniSchema = z
  .object({
    id: z.string().uuid(),
    year: z.number().nullable(),
    price: z.number().nullable(),
    city: z.string().nullable(),
    car_brands: z
      .object({ name: z.string() })
      .nullable()
      .optional()
      .transform((v) => v?.name ?? null),
    car_models: z
      .object({ name: z.string() })
      .nullable()
      .optional()
      .transform((v) => v?.name ?? null),
  })
  .nullable()
  .optional()
  .transform((v) =>
    v == null
      ? null
      : {
          id: v.id,
          year: v.year,
          price: v.price,
          city: v.city,
          brand_name: v.car_brands ?? null,
          model_name: v.car_models ?? null,
        },
  );

const ReportSchema = z.object({
  id: z.string().uuid(),
  car_id: z.string().uuid(),
  reporter_id: z.string(),
  reason: z.string(),
  details: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  resolved_at: z.string().nullable(),
  cars: CarMiniSchema,
});

const ReportListSchema = z.object({
  reports: z.array(ReportSchema),
  total: z.number().int().nonnegative(),
});

async function actorEmailOrThrow(): Promise<string> {
  const { getServerSession } = await import("@/server/auth.server");
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) throw new Error("Not authenticated");
  return email.toLowerCase();
}

export const listCarReports = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.enum(["open", "resolved", "dismissed"]).optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    const limit = data?.limit ?? 50;
    const offset = data?.offset ?? 0;

    let query = supabaseAdmin
      .from("car_reports")
      .select("*, cars!inner(id, year, price, city, car_brands(name), car_models(name))", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (data?.status) query = query.eq("status", data.status);

    const { data: reports, error, count } = await query;
    if (error) throw error;
    return ReportListSchema.parse({ reports: reports ?? [], total: count ?? 0 });
  });

export const updateCarReport = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["open", "resolved", "dismissed"]),
    }),
  )
  .handler(async ({ data }) => {
    const email = await actorEmailOrThrow();
    const { data: report, error } = await supabaseAdmin
      .from("car_reports")
      .update({
        status: data.status,
        resolved_at: data.status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .select("id, status")
      .maybeSingle();
    if (error) throw error;
    if (!report) throw new Error("Report not found");
    return { report: { id: report.id, status: report.status } };
  });

export type CarReport = z.infer<typeof ReportSchema>;
