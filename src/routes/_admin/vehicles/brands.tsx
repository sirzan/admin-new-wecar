import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Tag, Plus, Loader2, Pencil, Trash2, Tag as TagIcon } from "lucide-react";
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
import { listBrands, createBrand, updateBrand, deleteBrand, type Brand } from "@/actions/brands";

export const Route = createFileRoute("/_admin/vehicles/brands")({
  head: () => ({ meta: [{ title: "Brands · Wecar Admin" }] }),
  component: BrandsPage,
});

const brandSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80"),
});
type BrandFormValues = z.infer<typeof brandSchema>;

function BrandsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Brand | null>(null);

  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: () => listBrands(),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = brandsQuery.data?.brands ?? [];
    if (!term) return list;
    return list.filter((b) => b.name.toLowerCase().includes(term));
  }, [brandsQuery.data, search]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (values: BrandFormValues) => createBrand({ data: values }),
    onSuccess: () => {
      toast.success("Marca creada");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setCreating(false);
    },
    onError: (err: Error) => toast.error("Error al crear", { description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: BrandFormValues & { id: string }) => updateBrand({ data: values }),
    onSuccess: () => {
      toast.success("Marca actualizada");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setEditing(null);
    },
    onError: (err: Error) =>
      toast.error("Error al actualizar", {
        description: err.message,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrand({ data: { id } }),
    onSuccess: () => {
      toast.success("Marca eliminada");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setDeleting(null);
    },
    onError: (err: Error) =>
      toast.error("Error al eliminar", {
        description: err.message,
      }),
  });

  const columns: DataTableColumn<Brand>[] = [
    {
      key: "icon",
      header: "",
      width: "60px",
      cell: () => (
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <TagIcon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      ),
    },
    {
      key: "name",
      header: "Nombre",
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "created_at",
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
            title="Editar"
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
            title="Eliminar"
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
          { label: "Vehicles Features", to: "/vehicles/brands" },
          { label: "Brands" },
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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Brands</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Marcas de vehículos disponibles en Wecar.
            </p>
          </div>

          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold shadow-[0_8px_24px_-8px_oklch(0.78_0.16_65/0.6)]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva brand
          </Button>
        </motion.div>

        <DataTable
          data={paginated}
          columns={columns}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Buscar brand…"
          loading={brandsQuery.isLoading || brandsQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={Tag}
              title="Aún no hay brands"
              description="Crea la primera marca para empezar a poblar el catálogo."
              actionLabel="Nueva brand"
              onAction={() => setCreating(true)}
            />
          }
        />
      </div>

      <BrandFormDrawer
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        title="Nueva brand"
        description="Crea una marca nueva en el catálogo."
        submitLabel="Crear"
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        loading={createMutation.isPending}
      />

      <BrandFormDrawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar brand"
        description={editing?.name ?? ""}
        submitLabel="Guardar cambios"
        defaultValues={editing ? { name: editing.name } : undefined}
        onSubmit={async (values) => {
          if (!editing) return;
          await updateMutation.mutateAsync({ ...values, id: editing.id });
        }}
        loading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Eliminar brand"
        description={
          deleting
            ? `¿Eliminar "${deleting.name}"? Se borrarán en cascada sus modelos y versiones. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleting) await deleteMutation.mutateAsync(deleting.id);
        }}
      />

      {brandsQuery.isError && (
        <div className="fixed bottom-4 right-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Error al cargar: {(brandsQuery.error as Error).message}
        </div>
      )}
    </>
  );
}

interface BrandDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  submitLabel?: string;
  loading?: boolean;
  defaultValues?: { name: string };
  onSubmit: (values: BrandFormValues) => Promise<void>;
}

function BrandFormDrawer({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  loading,
  defaultValues,
  onSubmit,
}: BrandDrawerProps) {
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: defaultValues ?? { name: "" },
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input autoFocus placeholder="Ej. Nissan" maxLength={80} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormDrawer>
  );
}
