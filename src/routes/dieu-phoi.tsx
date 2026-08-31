import { createFileRoute } from "@tanstack/react-router";
import { MapPanel } from "@/components/MapPanel";
import { Panel, StatCard } from "@/components/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { t } from "@/lib/i18n";
import { formatAddress, requests, teams, vehicles } from "@/lib/mock-data";

export const Route = createFileRoute("/dieu-phoi")({
  head: () => ({
    meta: [
      { title: "Trung tâm điều phối cứu hộ — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Bảng điều khiển cho điều phối viên: bản đồ sự cố, hàng đợi yêu cầu, trạng thái đội cứu hộ và phương tiện theo thời gian thực.",
      },
      { property: "og:title", content: "Trung tâm điều phối cứu hộ — Cứu Hộ Lũ" },
      {
        property: "og:description",
        content: "Xác minh, đánh giá ưu tiên và phân công đội cứu hộ trên một màn hình duy nhất.",
      },
    ],
  }),
  component: CoordinatorPage,
});

const vehicleState = {
  available: { key: "vehicle.available", cls: "bg-mint/15 text-mint" },
  inUse: { key: "vehicle.inUse", cls: "bg-amber/15 text-amber" },
  patrol: { key: "vehicle.patrol", cls: "bg-cyan/15 text-cyan" },
  maintenance: { key: "vehicle.maintenance", cls: "bg-white/10 text-muted-foreground" },
} as const;

const teamState = {
  rescuing: { key: "team.rescuing", cls: "bg-amber/15 text-amber" },
  available: { key: "team.available", cls: "bg-mint/15 text-mint" },
  resting: { key: "team.resting", cls: "bg-white/10 text-muted-foreground" },
} as const;

const workflow = [
  "Yêu cầu cứu hộ",
  t("coordinator.verify"),
  t("common.priority"),
  t("coordinator.assign"),
  "Theo dõi",
  t("status.done"),
];

function CoordinatorPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
            {t("coordinator.region")} · 05:42 (giờ địa phương)
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-card-foreground">
            {t("coordinator.title")}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-mint" /> {t("header.live")} · 05:42:17
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={t("coordinator.totalRequests")} value="128" hint="+12 trong 1 giờ" />
        <StatCard label={t("coordinator.urgent")} value="17" hint="cần ưu tiên cao" tone="coral" />
        <StatCard label={t("coordinator.unhandled")} value="9" hint="chưa xác minh" tone="amber" />
        <StatCard label={t("coordinator.activeTeams")} value="8" hint="/ 12 đội" tone="cyan" />
        <StatCard label={t("coordinator.readyTeams")} value="4" hint="chuẩn bị xuất phát" tone="mint" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MapPanel className="lg:col-span-2" />

        <Panel
          title={t("coordinator.vehicles")}
          action={<span className="text-[11px] text-muted-foreground">4/6 sẵn sàng</span>}
        >
          <ul className="space-y-3 text-sm">
            {vehicles.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-xl border border-border bg-white/[0.03] px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-card-foreground">
                  <span className="text-lg">{v.icon}</span> {v.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${vehicleState[v.state].cls}`}
                >
                  {t(vehicleState[v.state].key)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title={t("coordinator.liveRequests")}
          className="lg:col-span-2"
          action={
            <span className="text-xs font-semibold text-violet">{t("common.viewAll")} →</span>
          }
        >
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl p-3 ${
                  r.priority === "critical" && r.status === "pending"
                    ? "glow-red border border-coral/40 bg-coral/5"
                    : "border border-border bg-white/[0.03]"
                }`}
              >
                <PriorityBadge priority={r.priority} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {formatAddress(r.address)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.people} {t("common.people")}
                    {r.children ? ` (${r.children} ${t("citizen.children").toLowerCase()})` : ""}
                    {r.injured ? ` (${r.injured} ${t("citizen.injured").toLowerCase()})` : ""} · {r.note}{" "}
                    · {r.time}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white/[0.03] p-3 text-[11px] text-muted-foreground">
            <span className="font-semibold text-card-foreground">{t("coordinator.workflow")}:</span>
            {workflow.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                {step}
                {i < workflow.length - 1 ? <span className="text-violet">→</span> : null}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={t("coordinator.onDutyTeams")}>
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
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${teamState[team.state].cls}`}
                >
                  {t(teamState[team.state].key)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
