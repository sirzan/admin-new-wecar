import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Banknote, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Topbar } from "@/components/admin/Topbar";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listStripePayments, type AdminStripePayment } from "@/actions/stripe-payments";

export const Route = createFileRoute("/_admin/stripe-payments/")({
  head: () => ({ meta: [{ title: "Payments · Wecar Admin" }] }),
  component: StripePaymentsPage,
});

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "succeeded", label: "Exitosos" },
  { value: "pending", label: "Pendientes" },
  { value: "failed", label: "Fallidos" },
  { value: "refunded", label: "Reembolsados" },
] as const;

function StripePaymentsPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  const paymentsQuery = useQuery({
    queryKey: ["stripe-payments", page, statusFilter],
    queryFn: () =>
      listStripePayments({
        data: {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      }),
  });

  const payments = paymentsQuery.data?.payments ?? [];
  const total = paymentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: DataTableColumn<AdminStripePayment>[] = [
    {
      key: "user",
      header: "Usuario",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
            {(row.profiles?.full_name ?? row.email ?? "?").match(/\b\w/g)?.slice(0, 2).join("").toUpperCase() ?? "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {row.profiles?.full_name ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground truncate">{row.email ?? "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (row) => (
        <span className="text-sm">{row.subscription?.plan?.name ?? "—"}</span>
      ),
    },
    {
      key: "car",
      header: "Auto",
      cell: (row) => {
        const brand = row.subscription?.car?.car_brands?.name ?? "";
        const model = row.subscription?.car?.car_models?.name ?? "";
        return (
          <span className="text-sm text-muted-foreground">
            {brand} {model || "—"}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Monto",
      cell: (row) => (
        <span className="tabular-nums font-medium">
          {new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: row.currency.toUpperCase(),
            maximumFractionDigits: 2,
          }).format(row.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (row) => {
        const tone =
          row.status === "succeeded"
            ? "success"
            : row.status === "failed"
              ? "danger"
              : row.status === "refunded"
                ? "warning"
                : "neutral";
        return <StatusBadge label={row.status} tone={tone} />;
      },
    },
    {
      key: "stripe",
      header: "Stripe ID",
      cell: (row) => (
        <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px] inline-block">
          {row.stripe_payment_intent_id ?? "—"}
        </span>
      ),
    },
    {
      key: "receipt",
      header: "Recibo",
      cell: (row) =>
        row.receipt_url ? (
          <a
            href={row.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ver recibo <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "created",
      header: "Fecha",
      cell: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <>
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Stripe Payments" }]} />

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
              Pagos
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Stripe Payments</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Historial de pagos procesados vía Stripe.
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
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={payments}
          columns={columns}
          rowKey={(row) => row.id}
          loading={paymentsQuery.isLoading || paymentsQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={Banknote}
              title="Sin pagos"
              description={
                statusFilter !== "all"
                  ? "No hay pagos con el filtro seleccionado."
                  : "Cuando se procese un pago aparecerá aquí."
              }
              actionLabel={statusFilter !== "all" ? "Limpiar filtro" : undefined}
              onAction={() => setStatusFilter("all")}
            />
          }
        />
      </div>
    </>
  );
}
