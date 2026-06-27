import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/_admin/vehicles/transmission")({
  head: () => ({ meta: [{ title: "Tipo de Transmisión · Wecar Admin" }] }),
  component: TransmissionPage,
});

function TransmissionPage() {
  return (
    <PlaceholderPage
      title="Tipo de Transmisión"
      description="Automática, Manual, CVT, DCT."
      icon={Layers}
      topBreadcrumb="Vehicles Features"
      currentBreadcrumb="Tipo de Transmisión"
    />
  );
}
