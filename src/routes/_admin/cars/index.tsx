import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Car, Star, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Topbar } from "@/components/admin/Topbar";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { listCars, updateCar, type AdminCar } from "@/actions/cars";

export const Route = createFileRoute("/_admin/cars/")({
  head: () => ({ meta: [{ title: "Cars · Wecar Admin" }] }),
  component: CarsPage,
});

const PAGE_SIZE = 25;

function CarsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  // Cheap debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const carsQuery = useQuery({
    queryKey: ["cars", debouncedSearch, page],
    queryFn: () =>
      listCars({
        data: {
          q: debouncedSearch || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
      }),
  });

  const cars = carsQuery.data?.cars ?? [];
  const total = carsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; featured: boolean }) => updateCar({ data: args }),
    onSuccess: (_, vars) => {
      toast.success(vars.featured ? "Marcado como destacado" : "Quitado de destacados");
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
    onError: (err: Error) => toast.error("Error al actualizar", { description: err.message }),
  });

  const columns: DataTableColumn<AdminCar>[] = [
    {
      key: "car",
      header: "Vehículo",
      cell: (row) => {
        const brand = row.car_brands?.name ?? "—";
        const model = row.car_models?.name ?? "—";
        const version = row.car_versions?.name;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground truncate">
              {brand} {model}
              {row.year ? ` ${row.year}` : ""}
            </span>
            {version && <span className="text-xs text-muted-foreground truncate">{version}</span>}
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Precio",
      cell: (row) =>
        row.price != null ? (
          <span className="tabular-nums">
            {new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: "MXN",
              maximumFractionDigits: 0,
            }).format(Number(row.price))}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "owner",
      header: "Vendedor",
      cell: (row) => (
        <div className="flex flex-col text-sm">
          <span className="text-foreground truncate">
            {row.owner?.full_name ?? row.owner?.email ?? "—"}
          </span>
          {row.city && <span className="text-xs text-muted-foreground">{row.city}</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (row) => (
        <StatusBadge
          label={row.car_statuses?.label ?? row.car_statuses?.name ?? "—"}
          tone={
            row.car_statuses?.name === "en_venta"
              ? "success"
              : row.car_statuses?.name === "cancelado"
                ? "danger"
                : row.car_statuses?.name === "promocion"
                  ? "primary"
                  : "warning"
          }
        />
      ),
    },
    {
      key: "featured",
      header: "Destacado",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            updateMutation.mutate({ id: row.id, featured: !row.featured });
          }}
          disabled={updateMutation.isPending}
          className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-background/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={row.featured ? "Quitar destacado" : "Marcar destacado"}
        >
          <Star
            className={`h-4 w-4 ${
              row.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
            }`}
          />
        </button>
      ),
    },
    {
      key: "created",
      header: "Publicado",
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
  ];

  return (
    <>
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Cars" }]} />

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
              Marketplace
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Cars</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Vehículos publicados en la plataforma.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="rounded-lg bg-card/60 border border-border px-2.5 py-1 tabular-nums font-medium">
              {total.toLocaleString("es-MX")}
            </span>
          </div>
        </motion.div>

        <DataTable
          data={cars}
          columns={columns}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          searchPlaceholder="Buscar por descripción…"
          loading={carsQuery.isLoading || carsQuery.isFetching}
          emptyState={
            <EmptyState
              icon={Car}
              title="Sin autos publicados"
              description="Cuando un vendedor publique su primer auto aparecerá aquí."
            />
          }
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        {carsQuery.isError && (
          <div className="fixed bottom-4 right-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {(carsQuery.error as Error).message}
          </div>
        )}
      </div>
    </>
  );
}
