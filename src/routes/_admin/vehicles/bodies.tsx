import { createFileRoute } from "@tanstack/react-router";
import { CarFront } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/_admin/vehicles/bodies")({
  head: () => ({ meta: [{ title: "Tipo de Carrocerías · Wecar Admin" }] }),
  component: BodiesPage,
});

function BodiesPage() {
  return (
    <PlaceholderPage
      title="Tipo de Carrocerías"
      description="Sedán, SUV, Hatchback, Pickup, etc."
      icon={CarFront}
      topBreadcrumb="Vehicles Features"
      currentBreadcrumb="Tipo de Carrocerías"
    />
  );
}
