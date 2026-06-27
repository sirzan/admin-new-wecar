import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";
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
  listAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  type Advertisement,
} from "@/actions/advertisements";

export const Route = createFileRoute("/_admin/advertisements")({
  head: () => ({ meta: [{ title: "Advertisements · Wecar Admin" }] }),
  component: AdvertisementsPage,
});

const PLACEMENTS = [
  { value: "home_hero", label: "Home · Hero" },
  { value: "home_inline", label: "Home · Inline" },
  { value: "search_inline", label: "Búsqueda · Inline" },
  { value: "detail_sidebar", label: "Detalle · Sidebar" },
  { value: "global_top", label: "Global · Top" },
] as const;

const STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activo" },
  { value: "paused", label: "Pausado" },
  { value: "archived", label: "Archivado" },
] as const;

const adSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,80}$/, "Slug: 2-80 minúsculas, dígitos o -"),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  image_url: z.union([z.string().url("URL inválida"), z.literal("")]).optional(),
  cta_label: z.string().trim().max(40).optional(),
  cta_url: z.union([z.string().url("URL inválida"), z.literal("")]).optional(),
  placement: z.enum(["home_hero", "home_inline", "search_inline", "detail_sidebar", "global_top"]),
  status: z.enum(["draft", "active", "paused", "archived"]),
  starts_at: z.string().trim().optional(),
  ends_at: z.string().trim().optional(),
  sort_order: z.coerce.number().int(),
});
type AdFormValues = z.infer<typeof adSchema>;

function AdvertisementsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [deleting, setDeleting] = useState<Advertisement | null>(null);

  const adsQuery = useQuery({
    queryKey: ["advertisements"],
    queryFn: () => listAdvertisements({ data: undefined }),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = adsQuery.data?.advertisements ?? [];
    if (!term) return list;
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.slug.toLowerCase().includes(term) ||
        (a.description ?? "").toLowerCase().includes(term),
    );
  }, [adsQuery.data, search]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (values: AdFormValues) =>
      createAdvertisement({
        data: {
          slug: values.slug,
          title: values.title,
          description: values.description || null,
          image_url: values.image_url || null,
          cta_label: values.cta_label || null,
          cta_url: values.cta_url || null,
          placement: values.placement,
          status: values.status,
          starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
          ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
          sort_order: values.sort_order,
        },
      }),
    onSuccess: () => {
      toast.success("Advertisement creado");
      queryClient.invalidateQueries({ queryKey: ["advertisements"] });
      setCreating(false);
    },
    onError: (err: Error) => toast.error("Error al crear", { description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: AdFormValues & { id: string }) =>
      updateAdvertisement({
        data: {
          id: values.id,
          slug: values.slug,
          title: values.title,
          description: values.description || null,
          image_url: values.image_url || null,
          cta_label: values.cta_label || null,
          cta_url: values.cta_url || null,
          placement: values.placement,
          status: values.status,
          starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
          ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
          sort_order: values.sort_order,
        },
      }),
    onSuccess: () => {
      toast.success("Advertisement actualizado");
      queryClient.invalidateQueries({ queryKey: ["advertisements"] });
      setEditing(null);
    },
    onError: (err: Error) => toast.error("Error al actualizar", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdvertisement({ data: { id } }),
    onSuccess: () => {
      toast.success("Advertisement eliminado");
      queryClient.invalidateQueries({ queryKey: ["advertisements"] });
      setDeleting(null);
    },
    onError: (err: Error) => toast.error("Error al eliminar", { description: err.message }),
  });

  const columns: DataTableColumn<Advertisement>[] = [
    {
      key: "icon",
      header: "",
      width: "60px",
      cell: () => (
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Megaphone className="h-4 w-4" strokeWidth={1.75} />
        </div>
      ),
    },
    {
      key: "title",
      header: "Título",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground truncate">{row.title}</span>
          <span className="text-xs text-muted-foreground font-mono truncate">{row.slug}</span>
        </div>
      ),
    },
    {
      key: "placement",
      header: "Placement",
      cell: (row) => (
        <StatusBadge
          label={PLACEMENTS.find((p) => p.value === row.placement)?.label ?? row.placement}
          tone="neutral"
        />
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (row) => (
        <StatusBadge
          label={STATUSES.find((s) => s.value === row.status)?.label ?? row.status}
          tone={
            row.status === "active"
              ? "success"
              : row.status === "paused"
                ? "warning"
                : row.status === "archived"
                  ? "neutral"
                  : "primary"
          }
        />
      ),
    },
    {
      key: "metrics",
      header: "Impresiones / Clicks",
      cell: (row) => (
        <span className="tabular-nums text-sm">
          {row.impressions.toLocaleString("es-MX")} · {row.clicks.toLocaleString("es-MX")}
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
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Advertisements" }]} />

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
              Marketing
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Advertisements</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Campañas y anuncios publicados en la plataforma Wecar.
            </p>
          </div>

          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo advertisement
          </Button>
        </motion.div>

        <DataTable
          data={paginated}
          columns={columns}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Buscar advertisement…"
          loading={adsQuery.isLoading || adsQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={Megaphone}
              title="Sin advertisements"
              description="Crea el primero para empezar a impulsar campañas en Wecar."
              actionLabel="Nuevo advertisement"
              onAction={() => setCreating(true)}
            />
          }
        />
      </div>

      <AdFormDrawer
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        title="Nuevo advertisement"
        submitLabel="Crear"
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        loading={createMutation.isPending}
      />

      <AdFormDrawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar advertisement"
        submitLabel="Guardar cambios"
        defaultValues={
          editing
            ? {
                slug: editing.slug,
                title: editing.title,
                description: editing.description ?? "",
                image_url: editing.image_url ?? "",
                cta_label: editing.cta_label ?? "",
                cta_url: editing.cta_url ?? "",
                placement: editing.placement as AdFormValues["placement"],
                status: editing.status as AdFormValues["status"],
                starts_at: editing.starts_at ? editing.starts_at.slice(0, 16) : "",
                ends_at: editing.ends_at ? editing.ends_at.slice(0, 16) : "",
                sort_order: editing.sort_order,
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
        title="Eliminar advertisement"
        description={
          deleting ? `¿Eliminar "${deleting.title}"? Esta acción no se puede deshacer.` : ""
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

interface AdDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel?: string;
  loading?: boolean;
  defaultValues?: AdFormValues;
  onSubmit: (values: AdFormValues) => Promise<void>;
}

function AdFormDrawer({
  open,
  onOpenChange,
  title,
  submitLabel,
  loading,
  defaultValues,
  onSubmit,
}: AdDrawerProps) {
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: defaultValues ?? {
      slug: "",
      title: "",
      description: "",
      image_url: "",
      cta_label: "",
      cta_url: "",
      placement: "home_hero",
      status: "draft",
      starts_at: "",
      ends_at: "",
      sort_order: 0,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="black-friday-2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placement</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de imagen</FormLabel>
                <FormControl>
                  <Input placeholder="https://cdn.wecar.mx/banner.png" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cta_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL del CTA</FormLabel>
                <FormControl>
                  <Input placeholder="https://wecar.mx/promos/xyz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cta_label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiqueta del CTA</FormLabel>
                <FormControl>
                  <Input placeholder="Ver promoción" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="starts_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inicio (opcional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>Visible desde esta fecha.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ends_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fin (opcional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>Se oculta después de esta fecha.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormDrawer>
  );
}
