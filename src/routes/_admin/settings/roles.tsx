import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, Plus, Power, PowerOff, Mail } from "lucide-react";
import { useState } from "react";
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
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  listAdminUsers,
  inviteAdmin,
  setAdminActive,
  updateAdminRoles,
  type AdminPanelUser,
} from "@/actions/admin-users";

export const Route = createFileRoute("/_admin/settings/roles")({
  head: () => ({ meta: [{ title: "Roles & Permissions · Wecar Admin" }] }),
  component: RolesPage,
});

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  role: z.enum(["superadmin", "manager", "viewer"]),
});
type InviteValues = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<
  InviteValues["role"],
  { label: string; tone: "primary" | "warning" | "neutral" }
> = {
  superadmin: { label: "Superadmin", tone: "primary" },
  manager: { label: "Manager", tone: "warning" },
  viewer: { label: "Viewer", tone: "neutral" },
};

function RolesPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(0);
  const [activeTarget, setActiveTarget] = useState<{
    user: AdminPanelUser;
    is_active: boolean;
  } | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAdminUsers(),
  });

  const users = usersQuery.data?.users ?? [];

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const paginated = users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const inviteMutation = useMutation({
    mutationFn: (values: InviteValues) => inviteAdmin({ data: values }),
    onSuccess: () => {
      toast.success("Admin invitado", {
        description: "El usuario puede restablecer su contraseña al iniciar sesión.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreating(false);
    },
    onError: (err: Error) => toast.error("Error al invitar", { description: err.message }),
  });

  const setActiveMutation = useMutation({
    mutationFn: (args: { user_id: string; is_active: boolean }) => setAdminActive({ data: args }),
    onSuccess: (_, vars) => {
      toast.success(vars.is_active ? "Admin activado" : "Admin desactivado");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setActiveTarget(null);
    },
    onError: (err: Error) => toast.error("Error al actualizar", { description: err.message }),
  });

  const updateRolesMutation = useMutation({
    mutationFn: (args: { user_id: string; roles: AdminPanelUser["roles"] }) =>
      updateAdminRoles({ data: args }),
    onSuccess: () => {
      toast.success("Roles actualizados");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error("Error al actualizar roles", { description: err.message }),
  });

  const columns: DataTableColumn<AdminPanelUser>[] = [
    {
      key: "user",
      header: "Admin",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {(row.full_name ?? row.email).match(/\b\w/g)?.slice(0, 2).join("").toUpperCase() ?? "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground truncate">{row.full_name ?? "—"}</span>
            <span className="text-xs text-muted-foreground truncate">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.length === 0 ? (
            <span className="text-xs text-muted-foreground/60">—</span>
          ) : (
            row.roles.map((r) => (
              <StatusBadge key={r} label={ROLE_LABELS[r].label} tone={ROLE_LABELS[r].tone} />
            ))
          )}
        </div>
      ),
    },
    {
      key: "active",
      header: "Estado",
      cell: (row) =>
        row.is_active ? (
          <StatusBadge label="Activo" tone="success" />
        ) : (
          <StatusBadge label="Inactivo" tone="danger" />
        ),
    },
    {
      key: "last_login",
      header: "Último login",
      cell: (row) =>
        row.last_login_at ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {new Date(row.last_login_at).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">Nunca</span>
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
              setActiveTarget({ user: row, is_active: !row.is_active });
            }}
            aria-label={row.is_active ? "Desactivar" : "Activar"}
            title={row.is_active ? "Desactivar" : "Activar"}
            className={
              row.is_active ? "text-muted-foreground hover:text-destructive" : "text-emerald-400"
            }
          >
            {row.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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
          { label: "Settings", to: "/settings/roles" },
          { label: "Roles & Permissions" },
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
              Settings
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Roles & Permissions
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Administradores con acceso al panel Wecar.
            </p>
          </div>

          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Invitar admin
          </Button>
        </motion.div>

        <DataTable
          data={paginated}
          columns={columns}
          rowKey={(row) => row.id}
          loading={usersQuery.isLoading || usersQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={ShieldCheck}
              title="Sin administradores"
              description="Invita al primer admin para empezar."
              actionLabel="Invitar admin"
              onAction={() => setCreating(true)}
            />
          }
        />
      </div>

      <InviteDrawer
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        onSubmit={async (values) => {
          await inviteMutation.mutateAsync(values);
        }}
        loading={inviteMutation.isPending}
      />

      <ConfirmDialog
        open={!!activeTarget}
        onOpenChange={(o) => !o && setActiveTarget(null)}
        title={activeTarget?.is_active ? "Activar admin" : "Desactivar admin"}
        description={
          activeTarget
            ? `${activeTarget.is_active ? "Activar" : "Desactivar"} a ${activeTarget.user.full_name ?? activeTarget.user.email}?`
            : ""
        }
        confirmLabel={activeTarget?.is_active ? "Activar" : "Desactivar"}
        destructive={!activeTarget?.is_active}
        loading={setActiveMutation.isPending}
        onConfirm={async () => {
          if (activeTarget) {
            await setActiveMutation.mutateAsync({
              user_id: activeTarget.user.id,
              is_active: activeTarget.is_active,
            });
          }
        }}
      />
    </>
  );
}

function InviteDrawer({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InviteValues) => Promise<void>;
  loading: boolean;
}) {
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", full_name: "", role: "viewer" },
  });

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Invitar administrador"
      description="Crea un usuario con acceso al panel. Deberá restablecer su contraseña al primer login."
      submitLabel="Crear invitación"
      loading={loading}
      onSubmit={form.handleSubmit(onSubmit)}
      size="md"
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="admin@wecar.mx" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre Apellido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol inicial</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="viewer">Viewer · sólo lectura</SelectItem>
                  <SelectItem value="manager">Manager · gestiona contenido</SelectItem>
                  <SelectItem value="superadmin">Superadmin · control total</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Puedes cambiar los roles después desde esta misma página.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <Mail className="h-4 w-4 shrink-0" />
          <span>
            El usuario se crea con contraseña temporal. Configura SMTP en Supabase Auth para enviar
            el email de recuperación, o comparte el link manualmente.
          </span>
        </div>
      </Form>
    </FormDrawer>
  );
}
