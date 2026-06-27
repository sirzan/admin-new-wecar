import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    if (typeof document !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/dashboard" });
    } else {
      const { requireAnonymous } = await import("@/actions/auth");
      await requireAnonymous();
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  );
}
