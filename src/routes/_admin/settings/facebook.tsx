import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/admin/Topbar";
import {
  IntegrationPageHeader,
  IntegrationTokenForm,
} from "@/components/admin/IntegrationTokenForm";

export const Route = createFileRoute("/_admin/settings/facebook")({
  head: () => ({ meta: [{ title: "Facebook Tokens · Wecar Admin" }] }),
  component: FacebookTokensPage,
});

function FacebookTokensPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Wecar", to: "/dashboard" },
          { label: "Settings", to: "/settings/facebook" },
          { label: "Facebook Tokens" },
        ]}
      />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <IntegrationPageHeader
          title="Facebook Tokens"
          description="Tokens de la app de Facebook para sincronizar inventario y leads."
        />
        <IntegrationTokenForm
          provider="facebook"
          title="Facebook"
          fields={["app_id", "app_secret", "access_token", "page_id", "notes"]}
          docsUrl="https://developers.facebook.com/docs/"
        />
      </div>
    </>
  );
}
