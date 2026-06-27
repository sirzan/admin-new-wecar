import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Plus, Pencil, Trash2, Crown } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { listPlans, createPlan, updatePlan, deletePlan, type Plan } from "@/actions/plans";

export const Route = createFileRoute("/_admin/plans/")({
  head: () => ({ meta: [{ title: "Plans · Wecar Admin" }] }),
  component: PlansPage,
});

const planSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]{2,40}$/, "Solo minúsculas, dígitos, _ y - (2-40)"),
  name: z.string().trim().min(2).max(80),
  price: z.coerce.number().nonnegative(),
  duration: z.string().trim().min(1).max(40),
  duration_weeks: z.coerce.number().int().positive(),
  max_cars: z.coerce.number().int().nonnegative(),
  highlight: z.boolean(),
  features: z
    .array(z.object({ value: z.string().trim().min(1).max(200) }))
    .min(1, "Agrega al menos una característica"),
});
type PlanFormValues = z.infer<typeof planSchema>;

function PlansPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => listPlans(),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = plansQuery.data?.plans ?? [];
    if (!term) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term),
    );
  }, [plansQuery.data, search]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (values: PlanFormValues) =>
      createPlan({
        data: {
          id: values.id,
          name: values.name,
          price: values.price,
          duration: values.duration,
          duration_weeks: values.duration_weeks,
          max_cars: values.max_cars,
          highlight: values.highlight,
          features: values.features.map((f) => f.value),
        },
      }),
    onSuccess: () => {
      toast.success("Plan creado");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setCreating(false);
    },
    onError: (err: Error) => toast.error("Error al crear", { description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: PlanFormValues & { originalId: string }) =>
      updatePlan({
        data: {
          id: values.originalId,
          name: values.name,
          price: values.price,
          duration: values.duration,
          duration_weeks: values.duration_weeks,
          max_cars: values.max_cars,
          highlight: values.highlight,
          features: values.features.map((f) => f.value),
        },
      }),
    onSuccess: () => {
      toast.success("Plan actualizado");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setEditing(null);
    },
    onError: (err: Error) =>
      toast.error("Error al actualizar", {
        description: err.message,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlan({ data: { id } }),
    onSuccess: () => {
      toast.success("Plan eliminado");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setDeleting(null);
    },
    onError: (err: Error) =>
      toast.error("Error al eliminar", {
        description: err.message,
      }),
  });

  const columns: DataTableColumn<Plan>[] = [
    {
      key: "icon",
      header: "",
      width: "60px",
      cell: (row) => (
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            row.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          {row.highlight ? (
            <Crown className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Plan",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.id}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Precio",
      cell: (row) => (
        <span className="tabular-nums">
          {new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0,
          }).format(row.price)}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duración",
      cell: (row) => (
        <span className="text-sm">
          {row.duration} <span className="text-muted-foreground">({row.duration_weeks} sem)</span>
        </span>
      ),
    },
    {
      key: "max_cars",
      header: "Max autos",
      cell: (row) => <span className="tabular-nums">{row.max_cars}</span>,
    },
    {
      key: "highlight",
      header: "Destacado",
      cell: (row) =>
        row.highlight ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[11px] font-semibold">
            <Crown className="h-3 w-3" /> Destacado
          </span>
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
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Plans" }]} />

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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Plans</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Planes de suscripción para vendedores.
            </p>
          </div>

          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo plan
          </Button>
        </motion.div>

        <DataTable
          data={paginated}
          columns={columns}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Buscar plan…"
          loading={plansQuery.isLoading || plansQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={Sparkles}
              title="Sin planes"
              description="Crea el primer plan de suscripción."
              actionLabel="Nuevo plan"
              onAction={() => setCreating(true)}
            />
          }
        />
      </div>

      <PlanFormDrawer
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        title="Nuevo plan"
        submitLabel="Crear"
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        loading={createMutation.isPending}
      />

      <PlanFormDrawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar plan"
        submitLabel="Guardar cambios"
        defaultValues={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                price: editing.price,
                duration: editing.duration,
                duration_weeks: editing.duration_weeks,
                max_cars: editing.max_cars,
                highlight: editing.highlight,
                features: editing.features.map((value) => ({ value })),
              }
            : undefined
        }
        onSubmit={async (values) => {
          if (!editing) return;
          await updateMutation.mutateAsync({ ...values, originalId: editing.id });
        }}
        loading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Eliminar plan"
        description={
          deleting
            ? `¿Eliminar el plan "${deleting.name}"? Las suscripciones existentes podrían romperse.`
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

interface PlanDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel?: string;
  loading?: boolean;
  defaultValues?: PlanFormValues;
  onSubmit: (values: PlanFormValues) => Promise<void>;
}

function PlanFormDrawer({
  open,
  onOpenChange,
  title,
  submitLabel,
  loading,
  defaultValues,
  onSubmit,
}: PlanDrawerProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: defaultValues ?? {
      id: "",
      name: "",
      price: 0,
      duration: "",
      duration_weeks: 4,
      max_cars: 1,
      highlight: false,
      features: [{ value: "" }],
    },
    values: defaultValues,
  });

  const features = useFieldArray({
    control: form.control,
    name: "features",
  });

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      submitLabel={submitLabel}
      loading={loading}
      onSubmit={form.handleSubmit(onSubmit)}
      size="lg"
    >
      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="basico" {...field} disabled={!!defaultValues} />
                </FormControl>
                <FormDescription>
                  Identificador único. Solo minúsculas, dígitos, _ y -.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Básico" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (MXN)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración (texto)</FormLabel>
                <FormControl>
                  <Input placeholder="30 días" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration_weeks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración (semanas)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_cars"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max autos</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="highlight"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2">
              <div>
                <FormLabel className="text-sm">Destacado</FormLabel>
                <FormDescription>Resaltar este plan en la landing.</FormDescription>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={field.value}
                onClick={() => field.onChange(!field.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  field.value ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    field.value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Características</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => features.append({ value: "" })}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar
            </Button>
          </div>
          {features.fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name={`features.${idx}.value`}
                render={({ field: f }) => (
                  <FormItem className="flex-1 mb-0">
                    <FormControl>
                      <Input placeholder={`Característica ${idx + 1}`} {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {features.fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => features.remove(idx)}
                  aria-label="Quitar"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Una característica por línea. Se guardan como JSONB.
          </p>
        </div>

        <FormField control={form.control} name="features" render={() => <FormMessage />} />
      </Form>
    </FormDrawer>
  );
}
