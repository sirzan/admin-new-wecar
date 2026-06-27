import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Topbar } from "@/components/admin/Topbar";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const Route = createFileRoute("/_admin/footer")({
  head: () => ({ meta: [{ title: "Configuración Footer · Wecar Admin" }] }),
  component: FooterConfigPage,
});

const schema = z.object({
  copyright_text: z.string().trim().max(200).optional().or(z.literal("")),
  legal_links_label: z.string().trim().max(60).optional().or(z.literal("")),
  show_newsletter: z.boolean(),
  newsletter_cta: z.string().trim().max(120).optional().or(z.literal("")),
  columns_json: z.string().trim().max(8000).optional().or(z.literal("")),
});

function FooterConfigPage() {
  return (
    <>
      <Topbar crumbs={[{ label: "Wecar", to: "/dashboard" }, { label: "Configuración Footer" }]} />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Contenido
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Configuración Footer
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Personaliza el pie de página del sitio público.
          </p>
        </div>
        <SettingsEditor
          settingKey="footer_config"
          title="Footer"
          schema={schema}
          fields={[
            {
              kind: "text",
              name: "copyright_text",
              label: "Copyright",
              placeholder: "© 2026 Wecar. Todos los derechos reservados.",
            },
            {
              kind: "text",
              name: "legal_links_label",
              label: "Etiqueta de links legales",
              placeholder: "Legal",
            },
            {
              kind: "boolean",
              name: "show_newsletter",
              label: "Mostrar newsletter",
              description: "Habilitar el bloque de suscripción al newsletter en el footer.",
            },
            {
              kind: "text",
              name: "newsletter_cta",
              label: "CTA del newsletter",
              placeholder: "Suscríbete y recibe novedades",
            },
            {
              kind: "textarea",
              name: "columns_json",
              label: "Columnas (JSON)",
              description:
                'Array JSON con las columnas del footer. Ej: [{"title":"Producto","links":[{"label":"Buscar","href":"/buscar"}]}]',
              rows: 10,
            },
          ]}
        />
      </div>
    </>
  );
}
