import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CreditCard, RefreshCw, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Topbar } from "@/components/admin/Topbar";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listSubscriptions, type AdminSubscription } from "@/actions/subscriptions";
import { listPlans } from "@/actions/plans";

export const Route = createFileRoute("/_admin/subscriptions/")({
  head: () => ({ meta: [{ title: "Subscriptions · Wecar Admin" }] }),
  component: SubscriptionsPage,
});

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activas" },
  { value: "paused", label: "Pausadas" },
  { value: "trialing", label: "Prueba" },
  { value: "cancelled", label: "Canceladas" },
  { value: "expired", label: "Expiradas" },
] as const;

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "primary"> = {
  active: "success",
  paused: "warning",
  trialing: "primary",
  cancelled: "danger",
  expired: "neutral",
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: "Mensual",
  yearly: "Anual",
  weekly: "Semanal",
  one_time: "Único",
};

function SubscriptionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => listPlans(),
  });

  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions", debouncedSearch, page, statusFilter, planFilter],
    queryFn: () =>
      listSubscriptions({
        data: {
          q: debouncedSearch || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          status: statusFilter !== "all" ? statusFilter : undefined,
          plan_id: planFilter !== "all" ? planFilter : undefined,
        },
      }),
  });

  const subscriptions = subscriptionsQuery.data?.subscriptions ?? [];
  const total = subscriptionsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: DataTableColumn<AdminSubscription>[] = [
    {
      key: "user",
      header: "Usuario",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {(row.profiles?.full_name ?? row.email ?? "?")
              .match(/\b\w/g)
              ?.slice(0, 2)
              .join("")
              .toUpperCase() ?? "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground text-sm truncate">
              {row.profiles?.full_name ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground truncate">{row.email ?? "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "car",
      header: "Auto",
      cell: (row) => {
        const brand = row.car?.car_brands?.name ?? "";
        const model = row.car?.car_models?.name ?? "";
        return (
          <span className="text-sm text-foreground truncate">
            {brand} {model}
          </span>
        );
      },
    },
    {
      key: "plan",
      header: "Plan",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{row.plan?.name ?? "—"}</span>
          {row.plan?.highlight && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
              Destacado
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (row) => (
        <StatusBadge label={row.status} tone={STATUS_TONE[row.status] ?? "neutral"} />
      ),
    },
    {
      key: "billing",
      header: "Ciclo",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {CYCLE_LABELS[row.billing_cycle] ?? row.billing_cycle}
        </span>
      ),
    },
    {
      key: "period",
      header: "Periodo",
      cell: (row) => {
        if (!row.current_period_start && !row.current_period_end) return <span className="text-xs text-muted-foreground/60">—</span>;
        const start = row.current_period_start
          ? new Date(row.current_period_start).toLocaleDateString("es-MX", { month: "short", day: "2-digit" })
          : "—";
        const end = row.current_period_end
          ? new Date(row.current_period_end).toLocaleDateString("es-MX", { month: "short", day: "2-digit" })
          : "—";
        return <span className="text-xs tabular-nums text-muted-foreground">{start} → {end}</span>;
      },
    },
    {
      key: "created",
      header: "Creada",
      cell: (row) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {new Date(row.created_at).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Acciones</div>,
      className: "justify-end",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: "/subscriptions/$id", params: { id: row.id } });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Detalle
        </Button>
      ),
    },
  ];

  return (
    <>
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Subscriptions" }]} />

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
              Suscripciones
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Subscriptions</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Suscripciones activas e historial de planes contratados.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="rounded-lg bg-card/60 border border-border px-2.5 py-1 tabular-nums font-medium">
              {total.toLocaleString("es-MX")}
            </span>
          </div>
        </motion.div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(0); }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={planFilter}
            onValueChange={(v) => { setPlanFilter(v); setPage(0); }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los planes</SelectItem>
              {(plansQuery.data?.plans ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={subscriptions}
          columns={columns}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Buscar por nombre o email…"
          loading={subscriptionsQuery.isLoading || subscriptionsQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(row) => navigate({ to: "/subscriptions/$id", params: { id: row.id } })}
          emptyState={
            <EmptyState
              icon={CreditCard}
              title="Sin suscripciones"
              description={
                statusFilter !== "all" || planFilter !== "all"
                  ? "No hay suscripciones con los filtros seleccionados."
                  : "Cuando un usuario contrate un plan aparecerá aquí."
              }
              actionLabel={statusFilter !== "all" || planFilter !== "all" ? "Limpiar filtros" : undefined}
              onAction={() => { setStatusFilter("all"); setPlanFilter("all"); }}
            />
          }
        />
      </div>
    </>
  );
}
