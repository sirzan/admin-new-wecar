import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShieldCheck,
  Megaphone,
  Car,
  Info,
  PanelBottom,
  FileWarning,
  Users,
  Settings,
  ChevronDown,
  KeyRound,
  Facebook,
  ShoppingBag,
  Phone,
  ScrollText,
  FileText,
  CarFront,
  Tag,
  Fuel,
  Cog,
  Boxes,
  GitBranch,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { label: string; to: string; icon: React.ElementType };
type Group = { label: string; items: Item[]; icon: React.ElementType };

const main: Item[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Garantía Wecar", to: "/warranty", icon: ShieldCheck },
  { label: "Advertisements", to: "/advertisements", icon: Megaphone },
  { label: "Cars", to: "/cars", icon: Car },
  { label: "Página Nosotros", to: "/about", icon: Info },
  { label: "Configuración Footer", to: "/footer", icon: PanelBottom },
  { label: "User Reports", to: "/reports", icon: FileWarning },
  { label: "Users", to: "/users", icon: Users },
];

const groups: Group[] = [
  {
    label: "Settings",
    icon: Settings,
    items: [
      { label: "Roles & Permissions", to: "/settings/roles", icon: KeyRound },
      { label: "Facebook Tokens", to: "/settings/facebook", icon: Facebook },
      { label: "Mercado Libre Tokens", to: "/settings/mercadolibre", icon: ShoppingBag },
    ],
  },
  {
    label: "Configuración",
    icon: ScrollText,
    items: [
      { label: "Información de Contacto", to: "/config/contact", icon: Phone },
      { label: "Políticas de Privacidad", to: "/config/privacy", icon: FileText },
      { label: "Términos y Condiciones", to: "/config/terms", icon: FileText },
    ],
  },
  {
    label: "Vehicles Features",
    icon: CarFront,
    items: [
      { label: "Tipo de Carrocerías", to: "/vehicles/bodies", icon: CarFront },
      { label: "Brands", to: "/vehicles/brands", icon: Tag },
      { label: "Fuel Types", to: "/vehicles/fuel", icon: Fuel },
      { label: "Steering Types", to: "/vehicles/steering", icon: Cog },
      { label: "Models", to: "/vehicles/models", icon: Boxes },
      { label: "Versions", to: "/vehicles/versions", icon: GitBranch },
      { label: "Tipo de Transmisión", to: "/vehicles/transmission", icon: Layers },
      { label: "Features Groups", to: "/vehicles/features", icon: Sparkles },
    ],
  },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState<Record<string, boolean>>({
    Settings: false,
    Configuración: false,
    "Vehicles Features": false,
  });

  const isActive = (to: string) => pathname === to;

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col"
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-[0_4px_20px_-4px_oklch(0.78_0.16_65/0.6)]">
          W
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground tracking-tight">Wecar</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarLabel>Overview</SidebarLabel>
        <ul className="space-y-0.5">
          {main.map((item) => (
            <SidebarLink key={item.to} item={item} active={isActive(item.to)} />
          ))}
        </ul>

        {groups.map((g) => {
          const Icon = g.icon;
          const isOpen = open[g.label];
          const hasActive = g.items.some((i) => isActive(i.to));
          return (
            <div key={g.label} className="mt-5">
              <button
                onClick={() => setOpen((o) => ({ ...o, [g.label]: !o[g.label] }))}
                className={cn(
                  "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground",
                  hasActive && "text-foreground",
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 opacity-70" />
                  {g.label}
                </span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")}
                />
              </button>
              <AnimatePresence initial={false}>
                {(isOpen || hasActive) && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden space-y-0.5 pl-2 mt-1"
                  >
                    {g.items.map((item) => (
                      <SidebarLink key={item.to} item={item} active={isActive(item.to)} nested />
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer user */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors cursor-pointer">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-amber-700 flex items-center justify-center text-sm font-semibold text-primary-foreground">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin Wecar</p>
            <p className="text-xs text-muted-foreground truncate">admin@wecar.mx</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </div>
  );
}

function SidebarLink({
  item,
  active,
  nested = false,
}: {
  item: Item;
  active: boolean;
  nested?: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.to}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
          nested && "py-1.5 text-[13px]",
          active &&
            "bg-sidebar-accent text-foreground shadow-[inset_0_0_0_1px_oklch(0.78_0.16_65/0.35)]",
        )}
      >
        {active && (
          <motion.span
            layoutId="active-pill"
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          )}
          strokeWidth={1.75}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}
