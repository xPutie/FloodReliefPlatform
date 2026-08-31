import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { t } from "@/lib/i18n";

const navItems = [
  { to: "/", labelKey: "nav.citizen" },
  { to: "/dieu-phoi", labelKey: "nav.coordinator" },
  { to: "/doi-cuu-ho", labelKey: "nav.team" },
  { to: "/cuu-tro", labelKey: "nav.relief" },
  { to: "/quan-tri", labelKey: "nav.admin" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink2 via-ink to-black" />
      <div className="absolute -top-24 right-1/4 -z-10 h-96 w-96 rounded-full bg-violet/20 blur-[110px]" />
      <div className="absolute bottom-0 left-1/4 -z-10 h-80 w-80 rounded-full bg-cyan/10 blur-[110px]" />

      <header className="glass sticky top-0 z-20 border-x-0 border-t-0 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-5">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <div className="glow-vio grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet to-cyan text-lg">
              🌊
            </div>
            <div className="leading-tight">
              <p className="font-display text-lg font-bold tracking-tight text-card-foreground">
                {t("app.name")}
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("app.tagline")}
              </p>
            </div>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-lg px-3.5 py-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-card-foreground"
                activeProps={{ className: "bg-white/10 font-semibold text-card-foreground" }}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-coral/40 bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral sm:flex">
              <span className="size-2 animate-pulse rounded-full bg-coral" />4 {t("header.emergencyCount")}
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-cyan to-violet text-sm font-bold text-primary-foreground">
              TĐ
            </div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 text-sm md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="shrink-0 rounded-lg px-3 py-1.5 text-muted-foreground"
              activeProps={{ className: "bg-white/10 font-semibold text-card-foreground" }}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </div>
  );
}
