import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/server";

const SeriesPointSchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
});

const CarReportSchema = z.object({
  id: z.string().uuid(),
  car_id: z.string().uuid(),
  reason: z.string(),
  status: z.string(),
  created_at: z.string(),
});

const CreditApplicationSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string(),
  status: z.string(),
  created_at: z.string(),
  car_price: z.number().nullable(),
});

const StatsSchema = z.object({
  counts: z.object({
    cars: z.number().int().nonnegative(),
    active_cars: z.number().int().nonnegative(),
    users: z.number().int().nonnegative(),
    new_users: z.number().int().nonnegative(),
    advertisements: z.number().int().nonnegative(),
    active_advertisements: z.number().int().nonnegative(),
    subscriptions: z.number().int().nonnegative(),
    activas_financieras: z.number().int().nonnegative(),
    credit_applications: z.number().int().nonnegative(),
  }),
  series: z.object({
    cars: z.array(SeriesPointSchema),
    users: z.array(SeriesPointSchema),
    credit_applications: z.array(SeriesPointSchema),
  }),
  recent: z.object({
    car_reports: z.array(CarReportSchema),
    credit_applications: z.array(CreditApplicationSchema),
  }),
  window_days: z.number().int().positive(),
  generated_at: z.string(),
});

function bucketByDay(
  rows: { created_at: string }[],
  days: number,
): { date: string; count: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.created_at?.slice(0, 10);
    if (key && buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .validator(z.object({ days: z.number().int().min(1).max(365).optional() }).optional())
  .handler(async ({ data }) => {
    const days = Math.min(Math.max(data?.days ?? 30, 1), 365);
    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [
      carsCount,
      activeCarsCount,
      usersCount,
      newUsersCount,
      adsCount,
      activeAdsCount,
      subscriptionsCount,
      financierasCount,
      creditAppsCount,
      carsData,
      usersData,
      creditAppsData,
      recentReports,
      recentCreditApps,
    ] = await Promise.all([
      supabaseAdmin.from("cars").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("cars")
        .select("id, car_statuses!inner(name)", { count: "exact", head: true })
        .eq("car_statuses.name", "en_venta"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceIso),
      supabaseAdmin.from("advertisements").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("advertisements")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("financieras")
        .select("id", { count: "exact", head: true })
        .eq("activo", true),
      supabaseAdmin.from("credit_applications").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("cars").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("credit_applications").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin
        .from("car_reports")
        .select("id, car_id, reason, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("credit_applications")
        .select("id, full_name, email, status, created_at, car_price")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return StatsSchema.parse({
      counts: {
        cars: carsCount.count ?? 0,
        active_cars: activeCarsCount.count ?? 0,
        users: usersCount.count ?? 0,
        new_users: newUsersCount.count ?? 0,
        advertisements: adsCount.count ?? 0,
        active_advertisements: activeAdsCount.count ?? 0,
        subscriptions: subscriptionsCount.count ?? 0,
        activas_financieras: financierasCount.count ?? 0,
        credit_applications: creditAppsCount.count ?? 0,
      },
      series: {
        cars: bucketByDay(carsData.data ?? [], days),
        users: bucketByDay(usersData.data ?? [], days),
        credit_applications: bucketByDay(creditAppsData.data ?? [], days),
      },
      recent: {
        car_reports: recentReports.data ?? [],
        credit_applications: recentCreditApps.data ?? [],
      },
      window_days: days,
      generated_at: new Date().toISOString(),
    });
  });

export type DashboardStats = z.infer<typeof StatsSchema>;
export type SeriesPoint = z.infer<typeof SeriesPointSchema>;
export type RecentCarReport = z.infer<typeof CarReportSchema>;
export type RecentCreditApplication = z.infer<typeof CreditApplicationSchema>;
