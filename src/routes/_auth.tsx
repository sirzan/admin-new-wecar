import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAnonymous } from "@/actions/auth";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    await requireAnonymous();
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
