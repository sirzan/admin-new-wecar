import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/admin/Topbar";
import {
  IntegrationPageHeader,
  IntegrationTokenForm,
} from "@/components/admin/IntegrationTokenForm";

export const Route = createFileRoute("/_admin/settings/mercadolibre")({
  head: () => ({ meta: [{ title: "Mercado Libre Tokens · Wecar Admin" }] }),
  component: MercadoLibreTokensPage,
});

function MercadoLibreTokensPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Wecar", to: "/dashboard" },
          { label: "Settings", to: "/settings/mercadolibre" },
          { label: "Mercado Libre Tokens" },
        ]}
      />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <IntegrationPageHeader
          title="Mercado Libre Tokens"
          description="Credenciales OAuth para publicar y sincronizar con Mercado Libre."
        />
        <IntegrationTokenForm
          provider="mercadolibre"
          title="Mercado Libre"
          fields={["app_id", "app_secret", "access_token", "notes"]}
          docsUrl="https://developers.mercadolibre.com.mx/"
        />
      </div>
    </>
  );
}
