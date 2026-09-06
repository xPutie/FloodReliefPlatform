import { createFileRoute } from "@tanstack/react-router";
import { Panel, StatCard } from "@/components/StatCard";
import { t } from "@/lib/i18n";
import { areas, teams, users, vehicles } from "@/lib/mock-data";

export const Route = createFileRoute("/quan-tri")({
  head: () => ({
    meta: [
      { title: "Quản trị hệ thống — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Quản trị người dùng, vai trò, khu vực, đội cứu hộ, phương tiện, cấu hình hệ thống và báo cáo.",
      },
      { property: "og:title", content: "Quản trị hệ thống — Cứu Hộ Lũ" },
      {
        property: "og:description",
        content: "Trang quản trị dành cho quản trị viên hệ thống cứu hộ lũ lụt.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
          {t("coordinator.region")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-card-foreground">
          {t("admin.title")}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={t("admin.users")} value={`${users.length}`} tone="violet" />
        <StatCard label={t("admin.teams")} value={`${teams.length}`} tone="cyan" />
        <StatCard label={t("admin.vehicles")} value={`${vehicles.length}`} tone="amber" />
        <StatCard label={t("admin.areas")} value={`${areas.length}`} tone="mint" />
        <StatCard label={t("admin.reports")} value="12" hint="trong 24 giờ" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title={t("admin.users")}>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Họ tên</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("admin.roles")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("admin.areas")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="text-card-foreground">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold">{u.name}</p>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{u.role}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{u.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={t("admin.areas")}>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Tỉnh / Thành phố</th>
                  <th className="px-3 py-2 text-right font-semibold">Quận / Huyện</th>
                  <th className="px-3 py-2 text-right font-semibold">Phường / Xã</th>
                  <th className="px-3 py-2 text-right font-semibold">Yêu cầu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {areas.map((a) => (
                  <tr key={a.id} className="text-card-foreground">
                    <td className="px-3 py-2.5 font-semibold">{a.level1}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{a.districts}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{a.wards}</td>
                    <td className="px-3 py-2.5 text-right text-cyan">{a.requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={t("admin.teams")}>
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.03] p-3"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan to-violet text-xs font-bold text-primary-foreground">
                  {team.code}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {team.members} {t("common.members")} · {team.vehicle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("admin.vehicles")}>
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-xl border border-border bg-white/[0.03] p-3 text-sm"
              >
                <span className="flex items-center gap-2 text-card-foreground">
                  <span className="text-lg">{v.icon}</span> {v.name}
                </span>
                <span className="text-xs text-muted-foreground">{t(`vehicle.${v.state}` as never)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
