import { createServerFn } from "@tanstack/react-start";

export const requireAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { getServerSession } = await import("@/server/auth.server");
  const session = await getServerSession();
  if (!session) {
    const { redirect } = await import("@tanstack/react-router");
    throw redirect({ to: "/login" });
  }
  return { authenticated: true as const };
});

export const requireAnonymous = createServerFn({ method: "GET" }).handler(async () => {
  const { getServerSession } = await import("@/server/auth.server");
  const session = await getServerSession();
  if (session) {
    const { redirect } = await import("@tanstack/react-router");
    throw redirect({ to: "/dashboard" });
  }
  return { anonymous: true as const };
});
