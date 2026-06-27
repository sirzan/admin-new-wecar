import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    if (typeof document !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw redirect({ to: "/login" });
    } else {
      const { requireAdmin } = await import("@/actions/auth");
      await requireAdmin();
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
