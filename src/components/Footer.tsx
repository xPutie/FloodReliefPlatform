import { Link } from "@tanstack/react-router";
import { t } from "@/lib/i18n";

const footerNav = [
  { to: "/", labelKey: "nav.citizen" },
  { to: "/dieu-phoi", labelKey: "nav.coordinator" },
  { to: "/doi-cuu-ho", labelKey: "nav.team" },
  { to: "/cuu-tro", labelKey: "nav.relief" },
  { to: "/quan-tri", labelKey: "nav.admin" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 shadow-md">
                <img src="/favicon.png" alt="Logo" className="size-full rounded-[10px] object-cover" />
              </div>
              <div>
                <p className="font-display text-base font-extrabold text-white leading-tight">
                  {t("app.name")}
                </p>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  TRUNG TÂM CHỈ HUY CỨU HỘ KHẨN CẤP
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              Nền tảng kết nối trực tiếp người dân ngập lụt, trung tâm chỉ huy điều phối và các đội cứu hộ chuyên nghiệp 24/7.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Hệ thống không gian làm việc
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs font-medium">
              {footerNav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <span>➔</span>
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* System Status & Emergency Helpline */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Đường dây nóng khẩn cấp
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded-xl px-3.5 py-2.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>HỆ THỐNG TRỰC BAN BÌNH THƯỜNG</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="font-medium">Tổng đài cứu nạn quốc gia:</span>
              <a href="tel:112" className="font-extrabold text-red-400 hover:text-red-300 text-sm font-mono hover:underline">
                ☎ 112
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© 2026 Flood Rescue Platform. Nền tảng chỉ huy & điều phối cứu hộ lũ lụt.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Đà Nẵng & Miền Trung</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">● Operational Readiness</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
