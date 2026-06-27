import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { Topbar } from "@/components/admin/Topbar";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  topBreadcrumb: string;
  currentBreadcrumb: string;
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon = Construction,
  topBreadcrumb,
  currentBreadcrumb,
}: PlaceholderPageProps) {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Wecar", to: "/dashboard" },
          { label: topBreadcrumb, to: "/dashboard" },
          { label: currentBreadcrumb },
        ]}
      />
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <div className="mb-8 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary mb-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              Catálogo
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 max-w-2xl">
          <div className="flex items-start gap-3">
            <Construction className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-100 space-y-2">
              <p className="font-medium">Pendiente de migración a tabla</p>
              <p className="text-amber-200/80">
                Actualmente este atributo se modela como enum en la tabla{" "}
                <code className="font-mono text-xs">public.cars</code>. La gestión visual desde el
                panel requiere migrar estos valores a tablas catálogo y crear las policies RLS
                correspondientes.
              </p>
              <p className="text-amber-200/80">
                Mientras tanto, los valores se pueden editar directamente en la base de datos desde
                el SQL editor de Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
