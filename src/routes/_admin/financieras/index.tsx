import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Building2, Plus, Pencil, Trash2, Star } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  listFinancieras,
  createFinanciera,
  updateFinanciera,
  deleteFinanciera,
  type Financiera,
} from "@/actions/financieras";

export const Route = createFileRoute("/_admin/financieras/")({
  head: () => ({ meta: [{ title: "Financieras · Wecar Admin" }] }),
  component: FinancierasPage,
});

const TIPOS = [
  { value: "banco", label: "Banco" },
  { value: "financiera_marca", label: "Financiera de marca" },
  { value: "autofinanciamiento", label: "Autofinanciamiento" },
  { value: "prendaria", label: "Prendaria" },
  { value: "fintech", label: "Fintech" },
] as const;

// Form-side schema (allows empty strings for nullable numbers/strings).
const financieraFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,60}$/, "Slug: 2-60 minúsculas, dígitos o -"),
  nombre: z.string().trim().min(2).max(120),
  tipo: z.enum(["banco", "financiera_marca", "autofinanciamiento", "prendaria", "fintech"]),
  logo: z.string().trim().min(1).max(20),
  color: z.string().trim().min(1).max(120),
  tasa_min: z.coerce.number().nonnegative(),
  tasa_max: z.coerce.number().nonnegative(),
  cat_min: z.coerce.number().nonnegative(),
  cat_max: z.coerce.number().nonnegative(),
  enganche_pct: z.coerce.number().int().min(0).max(100),
  plazo_max: z.coerce.number().int().min(1),
  // Use union without transform; we coerce to number|null at submit time.
  score_min: z.union([z.coerce.number().int().min(0).max(850), z.literal("")]),
  destacado: z.boolean(),
  aplica_para: z.string().trim().max(200),
  contacto: z.string().trim().max(200),
  notas: z.string().trim().max(500),
  orden: z.coerce.number().int(),
  activo: z.boolean(),
});
type FinancieraFormValues = z.infer<typeof financieraFormSchema>;

// Payload schema (server-ready).
const financieraPayloadSchema = z.object({
  slug: z.string(),
  nombre: z.string(),
  tipo: z.enum(["banco", "financiera_marca", "autofinanciamiento", "prendaria", "fintech"]),
  logo: z.string(),
  color: z.string(),
  tasa_min: z.number(),
  tasa_max: z.number(),
  cat_min: z.number(),
  cat_max: z.number(),
  enganche_pct: z.number().int(),
  plazo_max: z.number().int(),
  score_min: z.number().int().nullable(),
  destacado: z.boolean(),
  aplica_para: z.string().nullable(),
  contacto: z.string().nullable(),
  notas: z.string().nullable(),
  orden: z.number().int(),
  activo: z.boolean(),
});
type FinancieraPayload = z.infer<typeof financieraPayloadSchema>;

function FinancierasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Financiera | null>(null);
  const [deleting, setDeleting] = useState<Financiera | null>(null);

  const financierasQuery = useQuery({
    queryKey: ["financieras"],
    queryFn: () => listFinancieras(),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = financierasQuery.data?.financieras ?? [];
    if (!term) return list;
    return list.filter(
      (f) =>
        f.nombre.toLowerCase().includes(term) ||
        f.slug.toLowerCase().includes(term) ||
        f.tipo.toLowerCase().includes(term),
    );
  }, [financierasQuery.data, search]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (values: FinancieraFormValues) => {
      const payload = toPayload(values);
      return createFinanciera({ data: payload });
    },
    onSuccess: () => {
      toast.success("Financiera creada");
      queryClient.invalidateQueries({ queryKey: ["financieras"] });
      setCreating(false);
    },
    onError: (err: Error) => toast.error("Error al crear", { description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: FinancieraFormValues & { id: string }) => {
      const { id, ...rest } = values;
      const payload = toPayload(rest);
      return updateFinanciera({ data: { id, ...payload } });
    },
    onSuccess: () => {
      toast.success("Financiera actualizada");
      queryClient.invalidateQueries({ queryKey: ["financieras"] });
      setEditing(null);
    },
    onError: (err: Error) =>
      toast.error("Error al actualizar", {
        description: err.message,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinanciera({ data: { id } }),
    onSuccess: () => {
      toast.success("Financiera eliminada");
      queryClient.invalidateQueries({ queryKey: ["financieras"] });
      setDeleting(null);
    },
    onError: (err: Error) =>
      toast.error("Error al eliminar", {
        description: err.message,
      }),
  });

  const columns: DataTableColumn<Financiera>[] = [
    {
      key: "icon",
      header: "",
      width: "60px",
      cell: (row) => (
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${row.color} text-white font-bold text-xs shadow-inner`}
        >
          {row.logo.slice(0, 2).toUpperCase()}
        </div>
      ),
    },
    {
      key: "nombre",
      header: "Financiera",
      cell: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{row.nombre}</span>
            {row.destacado && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
          </div>
          <span className="text-xs text-muted-foreground font-mono">{row.slug}</span>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (row) => (
        <StatusBadge
          label={TIPOS.find((t) => t.value === row.tipo)?.label ?? row.tipo}
          tone="neutral"
        />
      ),
    },
    {
      key: "tasas",
      header: "Tasa / CAT",
      cell: (row) => (
        <span className="tabular-nums text-sm">
          {row.tasa_min}% – {row.tasa_max}%
          <span className="text-xs text-muted-foreground ml-1">
            ({row.cat_min}–{row.cat_max})
          </span>
        </span>
      ),
    },
    {
      key: "plazo",
      header: "Plazo máx",
      cell: (row) => <span className="tabular-nums text-sm">{row.plazo_max} m</span>,
    },
    {
      key: "activo",
      header: "Estado",
      cell: (row) =>
        row.activo ? (
          <StatusBadge label="Activa" tone="success" />
        ) : (
          <StatusBadge label="Inactiva" tone="danger" />
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
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Financieras" }]} />

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
              Financiamiento
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Financieras</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Opciones de crédito mostradas a los compradores.
            </p>
          </div>

          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva financiera
          </Button>
        </motion.div>

        <DataTable
          data={paginated}
          columns={columns}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Buscar financiera…"
          loading={financierasQuery.isLoading || financierasQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={Building2}
              title="Sin financieras"
              description="Agrega las primeras opciones de financiamiento."
              actionLabel="Nueva financiera"
              onAction={() => setCreating(true)}
            />
          }
        />
      </div>

      <FinancieraFormDrawer
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        title="Nueva financiera"
        submitLabel="Crear"
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        loading={createMutation.isPending}
      />

      <FinancieraFormDrawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar financiera"
        submitLabel="Guardar cambios"
        defaultValues={
          editing
            ? {
                slug: editing.slug,
                nombre: editing.nombre,
                tipo: editing.tipo as FinancieraFormValues["tipo"],
                logo: editing.logo,
                color: editing.color,
                tasa_min: editing.tasa_min,
                tasa_max: editing.tasa_max,
                cat_min: editing.cat_min,
                cat_max: editing.cat_max,
                enganche_pct: editing.enganche_pct,
                plazo_max: editing.plazo_max,
                score_min: editing.score_min ?? "",
                destacado: editing.destacado,
                aplica_para: editing.aplica_para ?? "",
                contacto: editing.contacto ?? "",
                notas: editing.notas ?? "",
                orden: editing.orden,
                activo: editing.activo,
              }
            : undefined
        }
        onSubmit={async (values) => {
          if (!editing) return;
          await updateMutation.mutateAsync({ ...values, id: editing.id });
        }}
        loading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Eliminar financiera"
        description={
          deleting ? `¿Eliminar "${deleting.nombre}"? Esta acción no se puede deshacer.` : ""
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

interface FinancieraDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel?: string;
  loading?: boolean;
  defaultValues?: FinancieraFormValues;
  onSubmit: (values: FinancieraFormValues) => Promise<void>;
}

function toPayload(values: FinancieraFormValues): FinancieraPayload {
  return {
    slug: values.slug,
    nombre: values.nombre,
    tipo: values.tipo,
    logo: values.logo,
    color: values.color,
    tasa_min: values.tasa_min,
    tasa_max: values.tasa_max,
    cat_min: values.cat_min,
    cat_max: values.cat_max,
    enganche_pct: values.enganche_pct,
    plazo_max: values.plazo_max,
    score_min:
      values.score_min === "" || values.score_min === undefined ? null : Number(values.score_min),
    destacado: values.destacado,
    aplica_para: values.aplica_para || null,
    contacto: values.contacto || null,
    notas: values.notas || null,
    orden: values.orden,
    activo: values.activo,
  };
}

function FinancieraFormDrawer({
  open,
  onOpenChange,
  title,
  submitLabel,
  loading,
  defaultValues,
  onSubmit,
}: FinancieraDrawerProps) {
  const form = useForm<FinancieraFormValues>({
    resolver: zodResolver(financieraFormSchema),
    defaultValues: defaultValues ?? {
      slug: "",
      nombre: "",
      tipo: "banco",
      logo: "",
      color: "from-zinc-600 to-zinc-800",
      tasa_min: 0,
      tasa_max: 0,
      cat_min: 0,
      cat_max: 0,
      enganche_pct: 10,
      plazo_max: 60,
      score_min: "",
      destacado: false,
      aplica_para: "",
      contacto: "",
      notas: "",
      orden: 0,
      activo: true,
    },
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
      size="lg"
    >
      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="bbva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="BBVA Auto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
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
            name="orden"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Menor = aparece primero.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo (texto)</FormLabel>
                <FormControl>
                  <Input placeholder="BB" maxLength={20} {...field} />
                </FormControl>
                <FormDescription>2-3 letras que se muestran en el avatar.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color (Tailwind gradient)</FormLabel>
                <FormControl>
                  <Input placeholder="from-blue-600 to-blue-800" maxLength={120} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tasa_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tasa mín (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tasa_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tasa máx (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cat_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CAT mín (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cat_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CAT máx (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="enganche_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enganche mín (%)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="plazo_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plazo máx (meses)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="score_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Score mínimo (opcional)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={850} placeholder="—" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="aplica_para"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aplica para</FormLabel>
                <FormControl>
                  <Input placeholder="Autos nuevos y seminuevos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contacto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="bbva.mx, 55 5226 2663" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Información adicional visible para el comprador"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <ToggleField
            label="Destacada"
            description="Resaltar en listados."
            value={form.watch("destacado")}
            onChange={(v) => form.setValue("destacado", v)}
          />
          <ToggleField
            label="Activa"
            description="Visible para los compradores."
            value={form.watch("activo")}
            onChange={(v) => form.setValue("activo", v)}
          />
        </div>
      </Form>
    </FormDrawer>
  );
}

function ToggleField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
