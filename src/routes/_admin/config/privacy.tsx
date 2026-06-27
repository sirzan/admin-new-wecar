import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Topbar } from "@/components/admin/Topbar";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const Route = createFileRoute("/_admin/config/privacy")({
  head: () => ({ meta: [{ title: "Políticas de Privacidad · Wecar Admin" }] }),
  component: PrivacyConfigPage,
});

const schema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal("")),
  effective_date: z.string().trim().max(40).optional().or(z.literal("")),
  body: z.string().trim().max(50000).optional().or(z.literal("")),
});

function PrivacyConfigPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Wecar", to: "/dashboard" },
          { label: "Configuración", to: "/config/privacy" },
          { label: "Políticas de Privacidad" },
        ]}
      />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Configuración
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Políticas de Privacidad
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Texto legal mostrado en la página /privacidad.
          </p>
        </div>
        <SettingsEditor
          settingKey="privacy_policy"
          title="Políticas de Privacidad"
          schema={schema}
          fields={[
            {
              kind: "text",
              name: "title",
              label: "Título",
              placeholder: "Políticas de Privacidad",
            },
            {
              kind: "text",
              name: "effective_date",
              label: "Fecha de vigencia",
              placeholder: "1 de enero de 2026",
            },
            {
              kind: "textarea",
              name: "body",
              label: "Contenido",
              placeholder: "Texto completo de las políticas…",
              rows: 18,
            },
          ]}
        />
      </div>
    </>
  );
}
