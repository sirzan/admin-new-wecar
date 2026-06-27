import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Topbar } from "@/components/admin/Topbar";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { listUsers, setUserAdmin, type AdminUser } from "@/actions/users";

export const Route = createFileRoute("/_admin/users/")({
  head: () => ({ meta: [{ title: "Users · Wecar Admin" }] }),
  component: UsersPage,
});

const PAGE_SIZE = 25;

function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const usersQuery = useQuery({
    queryKey: ["users", debouncedSearch, page],
    queryFn: () =>
      listUsers({
        data: {
          q: debouncedSearch || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
      }),
  });

  const users = usersQuery.data?.users ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const roleMutation = useMutation({
    mutationFn: (args: { user_id: string; is_admin: boolean }) => setUserAdmin({ data: args }),
    onSuccess: (_, vars) => {
      toast.success(vars.is_admin ? "Promovido a admin" : "Quitado rol admin");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setRoleTarget(null);
    },
    onError: (err: Error) => toast.error("Error al cambiar rol", { description: err.message }),
  });

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "user",
      header: "Usuario",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {(row.full_name ?? row.email ?? "?")
              .match(/\b\w/g)
              ?.slice(0, 2)
              .join("")
              .toUpperCase() ?? "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground truncate">{row.full_name ?? "—"}</span>
            <span className="text-xs text-muted-foreground truncate">{row.email ?? "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "city",
      header: "Ciudad",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.city ?? "—"}</span>,
    },
    {
      key: "didit",
      header: "KYC",
      cell: (row) =>
        row.didit_status ? (
          <StatusBadge
            label={row.didit_status}
            tone={
              row.didit_status === "verified"
                ? "success"
                : row.didit_status === "rejected"
                  ? "danger"
                  : "warning"
            }
          />
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "admin",
      header: "Rol",
      cell: (row) =>
        row.is_admin ? (
          <StatusBadge label="Admin" tone="primary" />
        ) : (
          <span className="text-xs text-muted-foreground">user</span>
        ),
    },
    {
      key: "actions",
      header: <div className="text-right">Acciones</div>,
      className: "justify-end",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setRoleTarget(row);
          }}
        >
          <ShieldCheck className="h-4 w-4 mr-1" />
          {row.is_admin ? "Quitar admin" : "Hacer admin"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Users" }]} />

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
              Comunidad
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Users</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Usuarios registrados en Wecar.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="rounded-lg bg-card/60 border border-border px-2.5 py-1 tabular-nums font-medium">
              {total.toLocaleString("es-MX")}
            </span>
          </div>
        </motion.div>

        <DataTable
          data={users}
          columns={columns}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          searchPlaceholder="Buscar por nombre o ciudad…"
          loading={usersQuery.isLoading || usersQuery.isFetching}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={Users}
              title="Sin usuarios"
              description="Cuando alguien se registre aparecerá aquí."
            />
          }
        />

      </div>

      <ConfirmDialog
        open={!!roleTarget}
        onOpenChange={(o) => !o && setRoleTarget(null)}
        title={roleTarget?.is_admin ? "Quitar rol de admin" : "Promover a admin"}
        description={
          roleTarget ? (
            <>
              {roleTarget.is_admin
                ? `¿Quitar permisos de admin a ${roleTarget.full_name ?? roleTarget.email}?`
                : `¿Promover a ${roleTarget.full_name ?? roleTarget.email} como admin de Wecar? Tendrá acceso al panel.`}
            </>
          ) : null
        }
        confirmLabel={roleTarget?.is_admin ? "Quitar admin" : "Hacer admin"}
        destructive={!!roleTarget?.is_admin}
        loading={roleMutation.isPending}
        onConfirm={async () => {
          if (!roleTarget) return;
          await roleMutation.mutateAsync({
            user_id: roleTarget.id,
            is_admin: !roleTarget.is_admin,
          });
        }}
      />
    </>
  );
}
