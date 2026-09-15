import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { t } from "@/lib/i18n";
import { Footer } from "./Footer";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { getWorkspaceRoleInfo } from "@/auth/route-access";

const navItems = [
  { to: "/", labelKey: "nav.citizen", subtitle: "Yêu cầu & theo dõi", roles: ["CITIZEN", "PUBLIC"] },
  { to: "/dieu-phoi", labelKey: "nav.coordinator", subtitle: "Xác minh & phân công", roles: ["COORDINATOR", "ADMIN"] },
  { to: "/doi-cuu-ho", labelKey: "nav.team", subtitle: "Nhiệm vụ cứu hộ", roles: ["TEAM_MEMBER", "ADMIN"] },
  { to: "/cuu-tro", labelKey: "nav.relief", subtitle: "Nhu cầu & nguồn lực", roles: ["RELIEF_STAFF", "ADMIN"] },
  { to: "/quan-tri", labelKey: "nav.admin", subtitle: "Giám sát hệ thống", roles: ["ADMIN"] },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();

  const { session, logout } = useAuth();
  const currentWorkspace = getWorkspaceRoleInfo(currentPath);

  const userRole = session.isAuthenticated ? session.user?.role : null;

  // Filter navigation items based on current authenticated role or show default for public
  const visibleNavItems = navItems.filter((item) => {
    if (item.to === "/") return true;
    if (!session.isAuthenticated) return true; // Show all for easy workspace navigation in demo
    if (userRole === "ADMIN") return true;
    return item.roles.includes(userRole as any);
  });

  const currentNavItem = navItems.find((item) =>
    item.to === "/" ? currentPath === "/" : currentPath.startsWith(item.to)
  );

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Global Command Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* LEFT: Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-0.5 text-white shadow-md transition-transform group-hover:scale-105">
              <img src="/favicon.png" alt="Cứu Hộ Lũ Logo" className="size-full rounded-[10px] object-cover" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                {t("app.name")}
              </p>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 flex items-center gap-1">
                <span>TRUNG TÂM CHỈ HUY</span>
                <span className="inline-block size-1 rounded-full bg-red-500 animate-pulse" />
              </p>
            </div>
          </Link>

          {/* CENTER: Desktop Navigation with Role Subtitles */}
          <nav className="hidden items-center gap-1 lg:flex">
            {visibleNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="group rounded-xl px-3.5 py-1.5 text-left transition-all hover:bg-slate-100/80"
                activeProps={{ className: "bg-blue-600/10 font-semibold text-blue-700 hover:bg-blue-600/15" }}
              >
                <span className="block text-sm font-bold text-slate-800 group-hover:text-blue-700">
                  {t(item.labelKey)}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {item.subtitle}
                </span>
              </Link>
            ))}
          </nav>

          {/* RIGHT: User Profile & Authentication */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-800 sm:flex shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <span>TRỰC TUYẾN 24/7</span>
            </div>

            {session.isAuthenticated && session.user ? (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="text-right leading-tight hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{session.user.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {session.user.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-2xs"
                  title="Đăng xuất khỏi hệ thống"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95"
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden font-bold"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* BREADCRUMB / PAGE CONTEXT BAR FOR DASHBOARDS */}
        {currentPath !== "/" && (
          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-1.5 text-xs text-slate-500 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div className="flex items-center gap-2">
                <Link to="/" className="hover:text-blue-600 font-medium">
                  Trung tâm chỉ huy
                </Link>
                <span>→</span>
                <span className="font-bold text-slate-800">
                  {currentNavItem ? t(currentNavItem.labelKey) : "Không xác định"}
                </span>
                {currentNavItem && (
                  <span className="text-slate-400 font-normal">
                    ({currentNavItem.subtitle})
                  </span>
                )}
              </div>

              {/* Internal Workspace Access Indicator */}
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                Vai trò UI: {session.isAuthenticated ? session.user?.role : currentWorkspace.role}
              </span>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  activeOptions={{ exact: item.to === "/" }}
                  className="rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-100"
                  activeProps={{ className: "bg-blue-50 text-blue-700" }}
                >
                  <span className="block text-sm font-bold text-slate-900">
                    {t(item.labelKey)}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {item.subtitle}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Page Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}


