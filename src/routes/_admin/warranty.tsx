import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ShieldCheck, Info } from "lucide-react";
import { Topbar } from "@/components/admin/Topbar";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const Route = createFileRoute("/_admin/warranty")({
  head: () => ({ meta: [{ title: "Garantía Wecar · Wecar Admin" }] }),
  component: WarrantyPage,
});

const schema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  coverage_items: z.string().trim().max(4000).optional().or(z.literal("")),
  exclusions: z.string().trim().max(4000).optional().or(z.literal("")),
  contact_email: z.string().email().optional().or(z.literal("")),
});

function WarrantyPage() {
  return (
    <>
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Garantía Wecar" }]} />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <div className="mb-8 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              Garantía
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Garantía Wecar</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Configura los términos, cobertura y exclusiones de la garantía.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            La garantía Wecar se aplica a compras seguras realizadas en la plataforma. Edita aquí
            los términos que se muestran en /garantia.
          </span>
        </div>

        <SettingsEditor
          settingKey="warranty_config"
          title="Garantía"
          schema={schema}
          fields={[
            {
              kind: "boolean",
              name: "enabled",
              label: "Garantía habilitada",
              description: "Mostrar el programa de garantía en el sitio público.",
            },
            { kind: "text", name: "title", label: "Título", placeholder: "Garantía Wecar" },
            {
              kind: "textarea",
              name: "description",
              label: "Descripción",
              rows: 4,
              placeholder: "Descripción general del programa…",
            },
            {
              kind: "textarea",
              name: "coverage_items",
              label: "Cobertura (markdown)",
              rows: 6,
              description: "Lista de puntos cubiertos por la garantía.",
            },
            {
              kind: "textarea",
              name: "exclusions",
              label: "Exclusiones (markdown)",
              rows: 6,
              description: "Casos no cubiertos por la garantía.",
            },
            {
              kind: "email",
              name: "contact_email",
              label: "Email de contacto",
              placeholder: "garantia@wecar.mx",
            },
          ]}
        />
      </div>
    </>
  );
}
