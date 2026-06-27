import { createFileRoute } from "@tanstack/react-router";
import { Cog } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/_admin/vehicles/steering")({
  head: () => ({ meta: [{ title: "Steering Types · Wecar Admin" }] }),
  component: SteeringPage,
});

function SteeringPage() {
  return (
    <PlaceholderPage
      title="Steering Types"
      description="Hidráulica, Eléctrica, Electro-hidráulica."
      icon={Cog}
      topBreadcrumb="Vehicles Features"
      currentBreadcrumb="Steering Types"
    />
  );
}
