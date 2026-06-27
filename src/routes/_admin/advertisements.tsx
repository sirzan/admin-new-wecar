import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  LayoutGrid,
  Rows3,
  Filter,
  Download,
  Megaphone,
} from "lucide-react";
import { useState } from "react";
import { Topbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/EmptyState";

export const Route = createFileRoute("/_admin/advertisements")({
  component: AdvertisementsPage,
  head: () => ({
    meta: [{ title: "Advertisements · Wecar Admin" }],
  }),
});

function AdvertisementsPage() {
  const [view, setView] = useState<"table" | "grid">("table");

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Wecar", to: "/advertisements" },
          { label: "Advertisements", to: "/advertisements" },
          { label: "Listado" },
        ]}
      />

      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              Marketing
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Advertisements
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Gestiona campañas y anuncios publicados en la plataforma Wecar.
            </p>
          </div>

          <Button className="group h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.78_0.16_65/0.6)] hover:bg-primary/90 hover:shadow-[0_10px_30px_-8px_oklch(0.78_0.16_65/0.8)] transition-all">
            <Plus className="h-4 w-4 mr-1.5 transition-transform group-hover:rotate-90 duration-300" />
            Crear advertisement
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: "Total", value: "0", hint: "Anuncios" },
            { label: "Activos", value: "0", hint: "En producción" },
            { label: "Borradores", value: "0", hint: "Sin publicar" },
            { label: "Impresiones", value: "0", hint: "Últimos 30 días" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card/60 p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {s.value}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{s.hint}</p>
            </div>
          ))}
        </motion.div>

        {/* Table card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card/40 overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="flex items-center gap-2 h-9 flex-1 rounded-lg border border-border bg-background/60 px-3 text-sm focus-within:border-primary/50 transition-colors">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Buscar advertisement…"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
                />
              </div>
              <button className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                <Download className="h-3.5 w-3.5" />
                Exportar
              </button>
              <div className="inline-flex h-9 items-center rounded-lg border border-border bg-background/60 p-0.5">
                <button
                  onClick={() => setView("table")}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    view === "table"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Table view"
                >
                  <Rows3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    view === "grid"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Table header (prepared) */}
          <div className="hidden md:grid grid-cols-[80px_1.5fr_120px_160px_100px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground border-b border-border bg-background/30">
            <div>Imagen</div>
            <div>Nombre</div>
            <div>Estado</div>
            <div>Fecha</div>
            <div className="text-right">Acciones</div>
          </div>

          {/* Empty state */}
          <EmptyState
            icon={Megaphone}
            title="No se encontraron registros"
            description="Aún no hay advertisements creados. Crea el primero para empezar a impulsar tus campañas en Wecar."
            actionLabel="Crear advertisement"
          />
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Wecar Admin · conectado a <span className="text-muted-foreground">wecar.mx</span>
        </p>
      </div>
    </>
  );
}
