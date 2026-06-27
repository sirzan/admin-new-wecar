import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Topbar } from "@/components/admin/Topbar";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const Route = createFileRoute("/_admin/config/contact")({
  head: () => ({ meta: [{ title: "Contacto · Wecar Admin" }] }),
  component: ContactConfigPage,
});

const schema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  hours: z.string().trim().max(200).optional().or(z.literal("")),
  social_instagram: z.string().trim().url().optional().or(z.literal("")),
  social_facebook: z.string().trim().url().optional().or(z.literal("")),
  social_tiktok: z.string().trim().url().optional().or(z.literal("")),
});

function ContactConfigPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Wecar", to: "/dashboard" },
          { label: "Configuración", to: "/config/contact" },
          { label: "Información de Contacto" },
        ]}
      />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Configuración
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Información de Contacto
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Datos de contacto y redes sociales mostrados en la landing.
          </p>
        </div>
        <SettingsEditor
          settingKey="contact_info"
          title="Información de Contacto"
          schema={schema}
          fields={[
            { kind: "email", name: "email", label: "Email", placeholder: "hola@wecar.mx" },
            { kind: "text", name: "phone", label: "Teléfono", placeholder: "+52 81 1234 5678" },
            { kind: "text", name: "whatsapp", label: "WhatsApp", placeholder: "+52 81 1234 5678" },
            {
              kind: "textarea",
              name: "address",
              label: "Dirección",
              placeholder: "Av. Constitución 1500, Monterrey, NL",
              rows: 2,
            },
            { kind: "text", name: "hours", label: "Horario", placeholder: "L-V 9:00–18:00" },
            { kind: "url", name: "social_instagram", label: "Instagram URL" },
            { kind: "url", name: "social_facebook", label: "Facebook URL" },
            { kind: "url", name: "social_tiktok", label: "TikTok URL" },
          ]}
        />
      </div>
    </>
  );
}
