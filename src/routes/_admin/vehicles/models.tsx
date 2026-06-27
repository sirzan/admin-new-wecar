import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Boxes, Plus, Tag as TagIcon, Pencil, Trash2 } from "lucide-react";
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
import { listModels, createModel, updateModel, deleteModel, type Model } from "@/actions/models";
import { listBrands, type Brand } from "@/actions/brands";

export const Route = createFileRoute("/_admin/vehicles/models")({
  head: () => ({ meta: [{ title: "Models · Wecar Admin" }] }),
  component: ModelsPage,
});

const modelSchema = z.object({
  brand_id: z.string().uuid("Selecciona una marca"),
  name: z.string().trim().min(1, "Requerido").max(80, "Máximo 80"),
});
type ModelFormValues = z.infer<typeof modelSchema>;

function ModelsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);
  const [deleting, setDeleting] = useState<Model | null>(null);

  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: () => listBrands(),
  });

  const modelsQuery = useQuery({
    queryKey: ["models", brandFilter !== "all" ? brandFilter : null],
    queryFn: () =>
      listModels({
        data: brandFilter !== "all" ? { brandId: brandFilter } : undefined,
      }),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = modelsQuery.data?.models ?? [];
    if (!term) return list;
    return list.filter((m) => {
      const brand = typeof m.car_brands === "string" ? m.car_brands : (m.car_brands ?? "");
      return m.name.toLowerCase().includes(term) || brand.toLowerCase().includes(term);
    });
  }, [modelsQuery.data, search]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (values: ModelFormValues) => createModel({ data: values }),
    onSuccess: () => {
      toast.success("Modelo creado");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setCreating(false);
    },
    onError: (err: Error) => toast.error("Error al crear", { description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ModelFormValues & { id: string }) => updateModel({ data: values }),
    onSuccess: () => {
      toast.success("Modelo actualizado");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setEditing(null);
    },
    onError: (err: Error) =>
      toast.error("Error al actualizar", {
        description: err.message,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteModel({ data: { id } }),
    onSuccess: () => {
      toast.success("Modelo eliminado");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setDeleting(null);
    },
    onError: (err: Error) =>
      toast.error("Error al eliminar", {
        description: err.message,
      }),
  });

  const columns: DataTableColumn<Model>[] = [
    {
      key: "icon",
      header: "",
      width: "60px",
      cell: () => (
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Boxes className="h-4 w-4" strokeWidth={1.75} />
        </div>
      ),
    },
    {
      key: "name",
      header: "Modelo",
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "brand",
      header: "Marca",
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <TagIcon className="h-3.5 w-3.5 opacity-70" />
          {typeof row.car_brands === "string" ? row.car_brands : (row.car_brands ?? "—")}
        </span>
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
          { label: "Vehicles Features", to: "/vehicles/models" },
          { label: "Models" },
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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Models</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Modelos de vehículos agrupados por marca.
            </p>
          </div>

          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold"
            disabled={!brandsQuery.data?.brands?.length}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo modelo
          </Button>
        </motion.div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {brandsQuery.data?.brands.map((b: Brand) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
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
          searchPlaceholder="Buscar modelo…"
          loading={modelsQuery.isLoading || modelsQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={Boxes}
              title="Sin modelos"
              description={
                brandsQuery.data?.brands?.length
                  ? "Crea el primer modelo para empezar."
                  : "Primero crea al menos una brand."
              }
              actionLabel={brandsQuery.data?.brands?.length ? "Nuevo modelo" : undefined}
              onAction={() => setCreating(true)}
            />
          }
        />
      </div>

      <ModelFormDrawer
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        title="Nuevo modelo"
        description="Crea un modelo nuevo bajo una marca existente."
        submitLabel="Crear"
        brands={brandsQuery.data?.brands ?? []}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        loading={createMutation.isPending}
      />

      <ModelFormDrawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar modelo"
        submitLabel="Guardar cambios"
        brands={brandsQuery.data?.brands ?? []}
        defaultValues={editing ? { brand_id: editing.brand_id, name: editing.name } : undefined}
        onSubmit={async (values) => {
          if (!editing) return;
          await updateMutation.mutateAsync({ ...values, id: editing.id });
        }}
        loading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Eliminar modelo"
        description={
          deleting
            ? `¿Eliminar "${deleting.name}"? Se borrarán en cascada sus versiones. Esta acción no se puede deshacer.`
            : ""
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

interface ModelDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  submitLabel?: string;
  loading?: boolean;
  brands: Brand[];
  defaultValues?: ModelFormValues;
  onSubmit: (values: ModelFormValues) => Promise<void>;
}

function ModelFormDrawer({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  loading,
  brands,
  defaultValues,
  onSubmit,
}: ModelDrawerProps) {
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: defaultValues ?? { brand_id: "", name: "" },
    values: defaultValues,
  });

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      submitLabel={submitLabel}
      loading={loading}
      onSubmit={form.handleSubmit(onSubmit)}
      size="sm"
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="brand_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={!brands.length}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una marca" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
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
              <FormLabel>Nombre del modelo</FormLabel>
              <FormControl>
                <Input autoFocus placeholder="Ej. Versa" maxLength={80} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormDrawer>
  );
}
