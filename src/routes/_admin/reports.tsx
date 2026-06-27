import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileWarning, Check, X as XIcon } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Topbar } from "@/components/admin/Topbar";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listCarReports, updateCarReport, type CarReport } from "@/actions/reports";

export const Route = createFileRoute("/_admin/reports")({
  head: () => ({ meta: [{ title: "User Reports · Wecar Admin" }] }),
  component: ReportsPage,
});

const PAGE_SIZE = 25;

function ReportsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [resolveTarget, setResolveTarget] = useState<CarReport | null>(null);
  const [dismissTarget, setDismissTarget] = useState<CarReport | null>(null);

  const reportsQuery = useQuery({
    queryKey: ["car-reports", statusFilter, page],
    queryFn: () =>
      listCarReports({
        data: {
          status:
            statusFilter !== "all"
              ? (statusFilter as "open" | "resolved" | "dismissed")
              : undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
      }),
  });

  const reports = reportsQuery.data?.reports ?? [];
  const total = reportsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; status: "open" | "resolved" | "dismissed" }) =>
      updateCarReport({ data: args }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "resolved"
          ? "Reporte resuelto"
          : vars.status === "dismissed"
            ? "Reporte descartado"
            : "Reporte reabierto",
      );
      queryClient.invalidateQueries({ queryKey: ["car-reports"] });
      setResolveTarget(null);
      setDismissTarget(null);
    },
    onError: (err: Error) => toast.error("Error al actualizar", { description: err.message }),
  });

  const columns: DataTableColumn<CarReport>[] = [
    {
      key: "car",
      header: "Auto reportado",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground truncate">
            {row.cars
              ? `${row.cars.brand_name ?? "?"} ${row.cars.model_name ?? "?"}${
                  row.cars.year ? ` ${row.cars.year}` : ""
                }`
              : "—"}
          </span>
          {row.cars?.city && <span className="text-xs text-muted-foreground">{row.cars.city}</span>}
        </div>
      ),
    },
    {
      key: "reason",
      header: "Motivo",
      cell: (row) => (
        <div className="flex flex-col max-w-md">
          <span className="font-medium truncate">{row.reason}</span>
          {row.details && (
            <span className="text-xs text-muted-foreground truncate">{row.details}</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (row) => (
        <StatusBadge
          label={row.status}
          tone={
            row.status === "open" ? "warning" : row.status === "resolved" ? "success" : "neutral"
          }
        />
      ),
    },
    {
      key: "created",
      header: "Reportado",
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
        <div className="flex items-center justify-end gap-1">
          {row.status !== "resolved" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setResolveTarget(row);
              }}
              className="text-emerald-400 hover:text-emerald-300"
            >
              <Check className="h-4 w-4 mr-1" />
              Resolver
            </Button>
          )}
          {row.status !== "dismissed" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDismissTarget(row);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Descartar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "User Reports" }]} />

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
              Moderación
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">User Reports</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Reportes de autos enviados por usuarios.
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
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abiertos</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
              <SelectItem value="dismissed">Descartados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={reports}
          columns={columns}
          rowKey={(row) => row.id}
          loading={reportsQuery.isLoading || reportsQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={FileWarning}
              title="Sin reportes"
              description="Cuando un usuario reporte un auto aparecerá aquí."
            />
          }
        />

      </div>

      <ConfirmDialog
        open={!!resolveTarget}
        onOpenChange={(o) => !o && setResolveTarget(null)}
        title="Marcar reporte como resuelto"
        description={
          resolveTarget ? `Confirmar resolución del reporte "${resolveTarget.reason}".` : ""
        }
        confirmLabel="Resolver"
        loading={updateMutation.isPending}
        onConfirm={async () => {
          if (resolveTarget)
            await updateMutation.mutateAsync({ id: resolveTarget.id, status: "resolved" });
        }}
      />

      <ConfirmDialog
        open={!!dismissTarget}
        onOpenChange={(o) => !o && setDismissTarget(null)}
        title="Descartar reporte"
        description={
          dismissTarget ? `El reporte "${dismissTarget.reason}" se marcará como descartado.` : ""
        }
        confirmLabel="Descartar"
        loading={updateMutation.isPending}
        onConfirm={async () => {
          if (dismissTarget)
            await updateMutation.mutateAsync({ id: dismissTarget.id, status: "dismissed" });
        }}
      />
    </>
  );
}
