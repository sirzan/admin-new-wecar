import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GitBranch, Plus, Boxes, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Topbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listVersions,
  createVersion,
  updateVersion,
  deleteVersion,
  type Version,
} from "@/actions/versions";
import { listModels, type Model } from "@/actions/models";

export const Route = createFileRoute("/_admin/vehicles/versions")({
  head: () => ({ meta: [{ title: "Versions · Wecar Admin" }] }),
  component: VersionsPage,
});

const versionSchema = z.object({
  model_id: z.string().uuid("Selecciona un modelo"),
  name: z.string().trim().min(1, "Requerido").max(120, "Máximo 120"),
  years: z.string().trim().max(60, "Máximo 60").optional().or(z.literal("")),
});
type VersionFormValues = z.infer<typeof versionSchema>;

function VersionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Version | null>(null);
  const [deleting, setDeleting] = useState<Version | null>(null);

  const modelsQuery = useQuery({
    queryKey: ["models", "all-for-versions"],
    queryFn: () => listModels({ data: undefined }),
  });

  const versionsQuery = useQuery({
    queryKey: ["versions", modelFilter !== "all" ? modelFilter : null],
    queryFn: () =>
      listVersions({
        data: modelFilter !== "all" ? { modelId: modelFilter } : undefined,
      }),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = versionsQuery.data?.versions ?? [];
    if (!term) return list;
    return list.filter((v) => {
      const modelName = v.car_models?.name ?? "";
      const brandName = v.car_models?.brand_name ?? "";
      return (
        v.name.toLowerCase().includes(term) ||
        modelName.toLowerCase().includes(term) ||
        brandName.toLowerCase().includes(term) ||
        (v.years ?? "").toLowerCase().includes(term)
      );
    });
  }, [versionsQuery.data, search]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (values: VersionFormValues) =>
      createVersion({ data: { ...values, years: values.years || null } }),
    onSuccess: () => {
      toast.success("Versión creada");
      queryClient.invalidateQueries({ queryKey: ["versions"] });
      setCreating(false);
    },
    onError: (err: Error) => toast.error("Error al crear", { description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: Partial<VersionFormValues> & { id: string }) =>
      updateVersion({ data: values }),
    onSuccess: () => {
      toast.success("Versión actualizada");
      queryClient.invalidateQueries({ queryKey: ["versions"] });
      setEditing(null);
    },
    onError: (err: Error) =>
      toast.error("Error al actualizar", {
        description: err.message,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVersion({ data: { id } }),
    onSuccess: () => {
      toast.success("Versión eliminada");
      queryClient.invalidateQueries({ queryKey: ["versions"] });
      setDeleting(null);
    },
    onError: (err: Error) =>
      toast.error("Error al eliminar", {
        description: err.message,
      }),
  });

  const columns: DataTableColumn<Version>[] = [
    {
      key: "icon",
      header: "",
      width: "60px",
      cell: () => (
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <GitBranch className="h-4 w-4" strokeWidth={1.75} />
        </div>
      ),
    },
    {
      key: "name",
      header: "Versión",
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "model",
      header: "Modelo",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{row.car_models?.name ?? "—"}</span>
          {row.car_models?.brand_name && (
            <span className="text-muted-foreground">· {row.car_models.brand_name}</span>
          )}
        </div>
      ),
    },
    {
      key: "years",
      header: "Años",
      cell: (row) =>
        row.years ? (
          <span className="text-sm tabular-nums text-muted-foreground">{row.years}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "actions",
      header: <div className="text-right">Acciones</div>,
      className: "justify-end",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(row);
            }}
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(row);
            }}
            aria-label="Eliminar"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Wecar", to: "/dashboard" },
          { label: "Vehicles Features", to: "/vehicles/versions" },
          { label: "Versions" },
        ]}
      />

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
              Catálogo
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Versions</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Variantes específicas de cada modelo.
            </p>
          </div>

          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold"
            disabled={!modelsQuery.data?.models?.length}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva versión
          </Button>
        </motion.div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filtrar por modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los modelos</SelectItem>
              {modelsQuery.data?.models.map((m: Model) => (
                <SelectItem key={m.id} value={m.id}>
                  {typeof m.car_brands === "string" ? `${m.car_brands} · ${m.name}` : m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={paginated}
          columns={columns}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Buscar versión…"
          loading={versionsQuery.isLoading || versionsQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={GitBranch}
              title="Sin versiones"
              description={
                modelsQuery.data?.models?.length
                  ? "Crea la primera versión para empezar."
                  : "Primero crea al menos un modelo."
              }
              actionLabel={modelsQuery.data?.models?.length ? "Nueva versión" : undefined}
              onAction={() => setCreating(true)}
            />
          }
        />
      </div>

      <VersionFormDrawer
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        title="Nueva versión"
        submitLabel="Crear"
        models={modelsQuery.data?.models ?? []}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        loading={createMutation.isPending}
      />

      <VersionFormDrawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar versión"
        submitLabel="Guardar cambios"
        models={modelsQuery.data?.models ?? []}
        defaultValues={
          editing
            ? { model_id: editing.model_id, name: editing.name, years: editing.years ?? "" }
            : undefined
        }
        onSubmit={async (values) => {
          if (!editing) return;
          await updateMutation.mutateAsync({
            id: editing.id,
            name: values.name,
            years: values.years ? values.years : undefined,
          });
        }}
        loading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Eliminar versión"
        description={
          deleting ? `¿Eliminar "${deleting.name}"? Esta acción no se puede deshacer.` : ""
        }
        confirmLabel="Eliminar"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleting) await deleteMutation.mutateAsync(deleting.id);
        }}
      />
    </>
  );
}

interface VersionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel?: string;
  loading?: boolean;
  models: Model[];
  defaultValues?: VersionFormValues;
  onSubmit: (values: VersionFormValues) => Promise<void>;
}

function VersionFormDrawer({
  open,
  onOpenChange,
  title,
  submitLabel,
  loading,
  models,
  defaultValues,
  onSubmit,
}: VersionDrawerProps) {
  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: defaultValues ?? { model_id: "", name: "", years: "" },
    values: defaultValues,
  });

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      submitLabel={submitLabel}
      loading={loading}
      onSubmit={form.handleSubmit(onSubmit)}
      size="md"
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="model_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={!models.length}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un modelo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {typeof m.car_brands === "string" ? `${m.car_brands} · ${m.name}` : m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la versión</FormLabel>
              <FormControl>
                <Input autoFocus placeholder="Ej. Exclusive CVT" maxLength={120} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="years"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Años</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 2020-2024 o 2022, 2023" maxLength={60} {...field} />
              </FormControl>
              <FormDescription>Rango o lista de años aplicables. Opcional.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormDrawer>
  );
}
