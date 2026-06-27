import { Bell, Search, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Topbar({ crumbs }: { crumbs: { label: string; to?: string }[] }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-6 glass-blur">
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
              {c.to && !last ? (
                <Link
                  to={c.to}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {c.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 h-9 w-72 rounded-lg border border-border bg-card/60 px-3 text-sm text-muted-foreground hover:border-primary/40 transition-colors">
          <Search className="h-4 w-4" />
          <input
            placeholder="Buscar en Wecar…"
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70 text-foreground"
          />
          <kbd className="hidden md:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_oklch(0.78_0.16_65)]" />
        </button>

        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-amber-700 flex items-center justify-center text-sm font-semibold text-primary-foreground cursor-pointer ring-2 ring-background hover:ring-primary/40 transition">
          A
        </div>
      </div>
    </header>
  );
}
