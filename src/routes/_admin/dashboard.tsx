import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Topbar } from "@/components/admin/Topbar";
import { Car, Users, Megaphone, ShieldCheck, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_admin/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard · Wecar Admin" }] }),
});

const stats = [
  { label: "Cars en catálogo", value: "1,248", delta: "+12.4%", icon: Car },
  { label: "Usuarios activos", value: "8,392", delta: "+3.1%", icon: Users },
  { label: "Advertisements", value: "42", delta: "+8", icon: Megaphone },
  { label: "Garantías activas", value: "317", delta: "+5.6%", icon: ShieldCheck },
];

function DashboardPage() {
  return (
    <>
      <Topbar crumbs={[{ label: "Wecar" }, { label: "Dashboard" }]} />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Resumen general de la operación Wecar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card/50 p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <s.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  {s.delta}
                </span>
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          Construye aquí gráficas, actividad reciente y módulos personalizados.
        </div>
      </div>
    </>
  );
}
