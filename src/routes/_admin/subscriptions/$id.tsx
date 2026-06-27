import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CreditCard,
  User,
  Car,
  Package,
  ArrowLeft,
  Calendar,
  RefreshCw,
  Ban,
  Play,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Topbar } from "@/components/admin/Topbar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  getSubscription,
  updateSubscriptionStatus,
  type AdminSubscription,
} from "@/actions/subscriptions";
import { listStripePayments, type AdminStripePayment } from "@/actions/stripe-payments";

export const Route = createFileRoute("/_admin/subscriptions/$id")({
  head: () => ({ meta: [{ title: "Subscription · Wecar Admin" }] }),
  component: SubscriptionDetailPage,
  loader: async ({ params }) => ({ id: params.id }),
});

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

function SubscriptionDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusTarget, setStatusTarget] = useState<{ status: string } | null>(null);

  const subscriptionQuery = useQuery({
    queryKey: ["subscription", id],
    queryFn: () => getSubscription({ data: { id } }),
  });

  const paymentsQuery = useQuery({
    queryKey: ["subscription-payments", id],
    queryFn: () =>
      listStripePayments({
        data: { subscription_id: id, limit: 100 },
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; status: string }) =>
      updateSubscriptionStatus({ data: { id: args.id, status: args.status as "active" | "paused" | "cancelled" | "expired" | "trialing" } }),
    onSuccess: (_, vars) => {
      toast.success(`Suscripción ${vars.status === "active" ? "activada" : vars.status === "paused" ? "pausada" : vars.status === "cancelled" ? "cancelada" : "actualizada"}`);
      queryClient.invalidateQueries({ queryKey: ["subscription", id] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setStatusTarget(null);
    },
    onError: (err: Error) => toast.error("Error al actualizar", { description: err.message }),
  });

  const sub = subscriptionQuery.data?.subscription;
  const payments = paymentsQuery.data?.payments ?? [];
  const loading = subscriptionQuery.isLoading;

  const payColumns: DataTableColumn<AdminStripePayment>[] = [
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
      key: "stripe_id",
      header: "Stripe ID",
      cell: (row) => (
        <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px] inline-block">
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
            Ver <ExternalLink className="h-3 w-3" />
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
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <>
        <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Subscriptions", to: "/subscriptions" }, { label: "..." }]} />
        <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!sub) {
    return (
      <>
        <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Subscriptions", to: "/subscriptions" }, { label: "No encontrada" }]} />
        <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          <EmptyState icon={CreditCard} title="Suscripción no encontrada" description="La suscripción que buscas no existe o fue eliminada." />
        </div>
      </>
    );
  }

  const statusActions: { label: string; status: string; icon: React.ElementType; variant?: "default" | "destructive" | "outline" }[] = [];
  if (sub.status === "active") {
    statusActions.push({ label: "Pausar", status: "paused", icon: Ban, variant: "outline" });
    statusActions.push({ label: "Cancelar", status: "cancelled", icon: XCircle, variant: "destructive" });
  } else if (sub.status === "paused" || sub.status === "trialing") {
    statusActions.push({ label: "Reanudar", status: "active", icon: Play });
    statusActions.push({ label: "Cancelar", status: "cancelled", icon: XCircle, variant: "destructive" });
  } else if (sub.status === "expired") {
    statusActions.push({ label: "Reanudar", status: "active", icon: Play });
  }

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Wecar", to: "/dashboard" },
          { label: "Subscriptions", to: "/subscriptions" },
          { label: sub.plan?.name ?? "Detalle" },
        ]}
      />

      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        {/* Back + Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate({ to: "/subscriptions" })}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a suscripciones
          </button>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Suscripción
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {sub.plan?.name ?? "Sin plan"}
                </h1>
                <StatusBadge label={sub.status} tone={STATUS_TONE[sub.status] ?? "neutral"} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle} · Creada{" "}
                {new Date(sub.created_at).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {statusActions.map((action) => (
                <Button
                  key={action.status}
                  variant={action.variant ?? "outline"}
                  size="sm"
                  onClick={() => setStatusTarget({ status: action.status })}
                  disabled={updateMutation.isPending}
                >
                  <action.icon className="h-4 w-4 mr-1.5" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-xl border border-border bg-card/40 p-5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
              <User className="h-3.5 w-3.5" />
              Usuario
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {(sub.profiles?.full_name ?? sub.email ?? "?").match(/\b\w/g)?.slice(0, 2).join("").toUpperCase() ?? "?"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">
                  {sub.profiles?.full_name ?? "Sin nombre"}
                </span>
                <span className="text-xs text-muted-foreground truncate">{sub.email ?? "—"}</span>
              </div>
            </div>
          </motion.div>

          {/* Car Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-xl border border-border bg-card/40 p-5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
              <Car className="h-3.5 w-3.5" />
              Vehículo
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {sub.car?.car_brands?.name ?? "—"} {sub.car?.car_models?.name ?? ""}
              </span>
              <span className="text-xs text-muted-foreground">
                {sub.car?.city ?? "Ciudad no especificada"}
                {sub.car?.year ? ` · ${sub.car.year}` : ""}
              </span>
              {sub.car?.price != null && (
                <span className="text-sm font-semibold text-foreground mt-1">
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                    maximumFractionDigits: 0,
                  }).format(Number(sub.car.price))}
                </span>
              )}
            </div>
          </motion.div>

          {/* Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-xl border border-border bg-card/40 p-5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
              <Package className="h-3.5 w-3.5" />
              Plan
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{sub.plan?.name ?? "—"}</span>
              {sub.plan?.highlight && (
                <Badge variant="default" className="text-[10px]">Destacado</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {sub.plan?.price != null && (
                <div className="flex justify-between">
                  <span>Precio</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(sub.plan.price)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Duración</span>
                <span className="text-foreground">{sub.plan?.duration} ({sub.plan?.duration_weeks} sem)</span>
              </div>
              <div className="flex justify-between">
                <span>Max autos</span>
                <span className="text-foreground">{sub.plan?.max_cars}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Subscription Details */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-border bg-card/40 p-5 mb-8"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            <Calendar className="h-3.5 w-3.5" />
            Detalles de suscripción
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">ID</span>
              <span className="text-sm font-mono text-foreground truncate block">{sub.id}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Ciclo de facturación</span>
              <span className="text-sm text-foreground">{CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Inicio del periodo</span>
              <span className="text-sm text-foreground">
                {sub.current_period_start
                  ? new Date(sub.current_period_start).toLocaleDateString("es-MX", {
                      year: "numeric", month: "short", day: "2-digit",
                    })
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Fin del periodo</span>
              <span className="text-sm text-foreground">
                {sub.current_period_end
                  ? new Date(sub.current_period_end).toLocaleDateString("es-MX", {
                      year: "numeric", month: "short", day: "2-digit",
                    })
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Stripe Subscription ID</span>
              <span className="text-sm font-mono text-foreground truncate block">
                {sub.stripe_subscription_id ?? "—"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Plan Features */}
        {sub.plan?.features && (sub.plan.features as string[]).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-xl border border-border bg-card/40 p-5 mb-8"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Características del plan
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(sub.plan.features as string[]).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            <CreditCard className="h-3.5 w-3.5" />
            Historial de pagos ({payments.length})
          </div>
          <DataTable
            data={payments}
            columns={payColumns}
            rowKey={(row) => row.id}
            loading={paymentsQuery.isLoading || paymentsQuery.isFetching}
            page={0}
            totalPages={1}
            onPageChange={() => {}}
            emptyState={
              <EmptyState
                icon={CreditCard}
                title="Sin pagos"
                description="No hay pagos registrados para esta suscripción."
              />
            }
          />
        </motion.div>
      </div>

      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(o) => !o && setStatusTarget(null)}
        title={
          statusTarget?.status === "active"
            ? "Reanudar suscripción"
            : statusTarget?.status === "paused"
              ? "Pausar suscripción"
              : statusTarget?.status === "cancelled"
                ? "Cancelar suscripción"
                : "Actualizar suscripción"
        }
        description={
          statusTarget?.status === "active"
            ? `¿Reanudar la suscripción de ${sub.profiles?.full_name ?? sub.email} al plan ${sub.plan?.name}?`
            : statusTarget?.status === "paused"
              ? `¿Pausar la suscripción de ${sub.profiles?.full_name ?? sub.email}? El usuario no tendrá los beneficios hasta que se reanude.`
              : statusTarget?.status === "cancelled"
                ? `¿Cancelar la suscripción de ${sub.profiles?.full_name ?? sub.email}? Esta acción no se puede deshacer.`
                : `¿Actualizar la suscripción de ${sub.profiles?.full_name ?? sub.email}?`
        }
        confirmLabel={
          statusTarget?.status === "active"
            ? "Reanudar"
            : statusTarget?.status === "paused"
              ? "Pausar"
              : statusTarget?.status === "cancelled"
                ? "Cancelar"
                : "Actualizar"
        }
        destructive={statusTarget?.status === "cancelled"}
        loading={updateMutation.isPending}
        onConfirm={async () => {
          if (statusTarget) await updateMutation.mutateAsync({ id: sub.id, status: statusTarget.status });
        }}
      />
    </>
  );
}
