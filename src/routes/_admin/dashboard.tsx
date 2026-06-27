import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Car,
  Users,
  Megaphone,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileWarning,
  RefreshCw,
  Loader2,
  Banknote,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Topbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/actions/stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Wecar Admin" }] }),
  component: DashboardPage,
});

interface MetricCardProps {
  label: string;
  value: number | string;
  hint?: string;
  delta?: { value: number; positive: boolean };
  icon: React.ElementType;
  tone?: "primary" | "emerald" | "amber" | "violet" | "sky";
  loading?: boolean;
}

function formatNumber(n: number): string {
  return n.toLocaleString("es-MX");
}

function MetricCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = "primary",
  loading,
}: MetricCardProps) {
  const toneClass: Record<NonNullable<MetricCardProps["tone"]>, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    violet: "bg-violet-500/10 text-violet-400",
    sky: "bg-sky-500/10 text-sky-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card/50 p-5 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div
          className={cn("h-10 w-10 rounded-xl flex items-center justify-center", toneClass[tone])}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
              delta.positive ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {delta.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {delta.value >= 0 ? "+" : ""}
            {delta.value}
          </span>
        )}
      </div>
      <div className="mt-5">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{hint}</p>}
      </div>
    </motion.div>
  );
}

function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats", 30],
    queryFn: () => getDashboardStats({ data: { days: 30 } }),
    refetchOnWindowFocus: false,
  });

  const stats = statsQuery.data;

  const totalCars = stats?.counts.cars ?? 0;
  const activeCars = stats?.counts.active_cars ?? 0;
  const totalUsers = stats?.counts.users ?? 0;
  const newUsers = stats?.counts.new_users ?? 0;
  const totalAds = stats?.counts.advertisements ?? 0;
  const activeAds = stats?.counts.active_advertisements ?? 0;
  const totalSubscriptions = stats?.counts.subscriptions ?? 0;
  const activasFinancieras = stats?.counts.activas_financieras ?? 0;
  const totalCreditApps = stats?.counts.credit_applications ?? 0;

  // Reshape series for the chart (only date + one count column).
  const carsChartData = useMemo(
    () =>
      (stats?.series.cars ?? []).map((p) => ({
        date: p.date.slice(5),
        autos: p.count,
      })),
    [stats?.series.cars],
  );

  const activityChartData = useMemo(() => {
    const users = stats?.series.users ?? [];
    const apps = stats?.series.credit_applications ?? [];
    const map = new Map<string, { date: string; usuarios: number; solicitudes: number }>();
    for (const u of users) {
      map.set(u.date, { date: u.date.slice(5), usuarios: u.count, solicitudes: 0 });
    }
    for (const a of apps) {
      const key = a.date;
      const existing = map.get(key);
      if (existing) {
        existing.solicitudes = a.count;
      } else {
        map.set(key, { date: key.slice(5), usuarios: 0, solicitudes: a.count });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [stats?.series.users, stats?.series.credit_applications]);

  return (
    <>
      <Topbar crumbs={[{ label: "Wecar" }, { label: "Dashboard" }]} />

      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              Operación
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Resumen general de la operación Wecar.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              statsQuery.refetch();
              toast.success("Actualizando…");
            }}
            disabled={statsQuery.isFetching}
            className="self-start md:self-auto"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1.5", statsQuery.isFetching && "animate-spin")} />
            Actualizar
          </Button>
        </motion.div>

        {statsQuery.isError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Error al cargar: {(statsQuery.error as Error).message}
          </div>
        )}

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Cars en catálogo"
            value={totalCars}
            hint={`${formatNumber(activeCars)} en venta`}
            icon={Car}
            tone="primary"
            loading={statsQuery.isLoading}
          />
          <MetricCard
            label="Usuarios totales"
            value={totalUsers}
            hint={`${formatNumber(newUsers)} nuevos · 30 d`}
            icon={Users}
            tone="emerald"
            loading={statsQuery.isLoading}
          />
          <MetricCard
            label="Advertisements"
            value={totalAds}
            hint={`${formatNumber(activeAds)} activos`}
            icon={Megaphone}
            tone="violet"
            loading={statsQuery.isLoading}
          />
          <MetricCard
            label="Financieras activas"
            value={activasFinancieras}
            hint={`${formatNumber(totalSubscriptions)} suscripciones`}
            icon={Banknote}
            tone="sky"
            loading={statsQuery.isLoading}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <MetricCard
            label="Solicitudes de crédito"
            value={totalCreditApps}
            hint="Histórico"
            icon={CreditCard}
            tone="amber"
            loading={statsQuery.isLoading}
          />
          <MetricCard
            label="Suscripciones"
            value={totalSubscriptions}
            hint="Activas + pasadas"
            icon={Sparkles}
            tone="primary"
            loading={statsQuery.isLoading}
          />
          <MetricCard
            label="Reportes recientes"
            value={stats?.recent.car_reports.length ?? 0}
            hint="Últimos 5"
            icon={FileWarning}
            tone="amber"
            loading={statsQuery.isLoading}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-2xl border border-border bg-card/40 p-5 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Autos publicados</h2>
                <p className="text-xs text-muted-foreground">Últimos 30 días</p>
              </div>
              <Car className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-64">
              {statsQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={carsChartData}>
                    <defs>
                      <linearGradient id="carsArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.78 0.16 65)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="oklch(0.78 0.16 65)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(20,20,20,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="autos"
                      stroke="oklch(0.78 0.16 65)"
                      strokeWidth={2}
                      fill="url(#carsArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card/40 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Actividad</h2>
                <p className="text-xs text-muted-foreground">Usuarios y solicitudes · 30 d</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-64">
              {statsQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(20,20,20,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    />
                    <Bar dataKey="usuarios" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar
                      dataKey="solicitudes"
                      stackId="a"
                      fill="oklch(0.78 0.16 65)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-5 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Usuarios nuevos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Solicitudes de crédito
              </span>
            </div>
          </motion.div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-2xl border border-border bg-card/40 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Solicitudes recientes</h2>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            {statsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !stats?.recent.credit_applications.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin solicitudes recientes.
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.recent.credit_applications.map((app) => (
                  <li
                    key={app.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{app.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium tabular-nums">
                        {app.car_price
                          ? new Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                              maximumFractionDigits: 0,
                            }).format(Number(app.car_price))
                          : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString("es-MX", {
                          month: "short",
                          day: "2-digit",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-border bg-card/40 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Reportes recientes</h2>
              <FileWarning className="h-4 w-4 text-muted-foreground" />
            </div>
            {statsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !stats?.recent.car_reports.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin reportes recientes.
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.recent.car_reports.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{r.reason}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {r.car_id.slice(0, 8)}…
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        r.status === "open"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-emerald-500/15 text-emerald-400",
                      )}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Wecar Admin · conectado a <span className="text-muted-foreground">wecar.mx</span>
        </p>

        {statsQuery.isFetching && !statsQuery.isLoading && (
          <div className="fixed bottom-4 right-4 rounded-lg border border-border bg-card/80 backdrop-blur px-3 py-2 text-xs text-muted-foreground shadow-lg flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Actualizando…
          </div>
        )}
      </div>
    </>
  );
}
