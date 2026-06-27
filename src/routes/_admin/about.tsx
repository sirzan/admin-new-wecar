import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Topbar } from "@/components/admin/Topbar";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const Route = createFileRoute("/_admin/about")({
  head: () => ({ meta: [{ title: "Página Nosotros · Wecar Admin" }] }),
  component: AboutConfigPage,
});

const aboutSchema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  mission: z.string().trim().max(1000).optional().or(z.literal("")),
  vision: z.string().trim().max(1000).optional().or(z.literal("")),
  values: z.string().trim().max(2000).optional().or(z.literal("")),
  team: z.string().trim().max(5000).optional().or(z.literal("")),
});

function AboutConfigPage() {
  return (
    <>
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Página Nosotros" }]} />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Contenido
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Página Nosotros</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Contenido de la página pública /nosotros.
          </p>
        </div>
        <SettingsEditor
          settingKey="about_page"
          title="Página Nosotros"
          schema={aboutSchema}
          fields={[
            { kind: "text", name: "title", label: "Título", placeholder: "Sobre Wecar" },
            {
              kind: "text",
              name: "subtitle",
              label: "Subtítulo",
              placeholder: "Conectamos compradores con vendedores verificados.",
            },
            {
              kind: "textarea",
              name: "mission",
              label: "Misión",
              placeholder: "Nuestra misión…",
              rows: 4,
            },
            {
              kind: "textarea",
              name: "vision",
              label: "Visión",
              placeholder: "Nuestra visión…",
              rows: 4,
            },
            {
              kind: "textarea",
              name: "values",
              label: "Valores",
              placeholder: "Integridad, transparencia…",
              rows: 4,
            },
            {
              kind: "textarea",
              name: "team",
              label: "Equipo (markdown)",
              placeholder: "Descripción del equipo…",
              rows: 8,
            },
          ]}
        />
      </div>
    </>
  );
}
