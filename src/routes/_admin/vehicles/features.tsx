import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/_admin/vehicles/features")({
  head: () => ({ meta: [{ title: "Features Groups · Wecar Admin" }] }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <PlaceholderPage
      title="Features Groups"
      description="Grupos de características (Confort, Seguridad, Tecnología)."
      icon={Sparkles}
      topBreadcrumb="Vehicles Features"
      currentBreadcrumb="Features Groups"
    />
  );
}
