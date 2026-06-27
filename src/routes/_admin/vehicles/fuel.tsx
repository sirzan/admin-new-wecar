import { createFileRoute } from "@tanstack/react-router";
import { Fuel } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/_admin/vehicles/fuel")({
  head: () => ({ meta: [{ title: "Fuel Types · Wecar Admin" }] }),
  component: FuelPage,
});

function FuelPage() {
  return (
    <PlaceholderPage
      title="Fuel Types"
      description="Gasolina, Diésel, Híbrido, Eléctrico."
      icon={Fuel}
      topBreadcrumb="Vehicles Features"
      currentBreadcrumb="Fuel Types"
    />
  );
}
