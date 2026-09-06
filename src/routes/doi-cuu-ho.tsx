import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel } from "@/components/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { t } from "@/lib/i18n";
import { formatAddress, requests } from "@/lib/mock-data";

export const Route = createFileRoute("/doi-cuu-ho")({
  head: () => ({
    meta: [
      { title: "Đội cứu hộ — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Bảng điều khiển cho đội cứu hộ: nhiệm vụ được giao, mức ưu tiên, vị trí cần cứu hộ, phương tiện và trạng thái nhiệm vụ.",
      },
      { property: "og:title", content: "Đội cứu hộ — Cứu Hộ Lũ" },
      {
        property: "og:description",
        content: "Nhận, bắt đầu, cập nhật và hoàn tất nhiệm vụ cứu hộ.",
      },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const assignments = requests.filter((r) => r.team === "Đội 03" || r.status === "assigned" || r.status === "rescuing");
  const [activeId, setActiveId] = useState(assignments[0]?.id);

  const active = assignments.find((r) => r.id === activeId) ?? assignments[0];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
          Đội 03 — Sông Thu Bồn
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-card-foreground">
          {t("team.title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title={t("team.assignments")} className="lg:col-span-1">
          <div className="space-y-2">
            {assignments.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveId(r.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  r.id === active?.id
                    ? "border-violet bg-violet/10"
                    : "border-border bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-card-foreground">#{r.id}</span>
                  <PriorityBadge priority={r.priority} />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {formatAddress(r.address)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.people} {t("common.people")} · {r.time}
                </p>
              </button>
            ))}
          </div>
        </Panel>

        <div className="lg:col-span-2">
          {active ? <AssignmentDetail r={active} /> : null}
        </div>
      </div>
    </main>
  );
}

function AssignmentDetail({ r }: { r: (typeof requests)[number] }) {
  return (
    <Panel title={`Nhiệm vụ #${r.id}`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white/[0.03] p-3">
          <p className="text-xs text-muted-foreground">{t("common.location")}</p>
          <p className="mt-1 text-sm font-semibold text-card-foreground">{formatAddress(r.address)}</p>
        </div>
        <div className="rounded-xl border border-border bg-white/[0.03] p-3">
          <p className="text-xs text-muted-foreground">{t("common.priority")}</p>
          <p className="mt-1"><PriorityBadge priority={r.priority} /></p>
        </div>
        <div className="rounded-xl border border-border bg-white/[0.03] p-3">
          <p className="text-xs text-muted-foreground">Số người cần hỗ trợ</p>
          <p className="mt-1 text-sm font-semibold text-card-foreground">
            {r.people} {t("common.people")}
            {r.children ? ` · ${r.children} ${t("citizen.children").toLowerCase()}` : ""}
            {r.elderly ? ` · ${r.elderly} ${t("citizen.elderly").toLowerCase()}` : ""}
            {r.injured ? ` · ${r.injured} ${t("citizen.injured").toLowerCase()}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white/[0.03] p-3">
          <p className="text-xs text-muted-foreground">{t("team.vehicle")}</p>
          <p className="mt-1 text-sm font-semibold text-card-foreground">Canoe 02 · Đội 03</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-white/[0.03] p-3">
        <p className="text-xs text-muted-foreground">{t("common.note")}</p>
        <p className="mt-1 text-sm text-card-foreground">{r.note}</p>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-white/[0.03] p-3">
        <span className="text-sm text-muted-foreground">{t("common.status")}</span>
        <StatusBadge status={r.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-accent-foreground">
          {t("team.accept")}
        </button>
        <button className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-2.5 text-sm font-semibold text-coral">
          {t("team.decline")}
        </button>
        <button className="rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          {t("team.start")}
        </button>
        <button className="rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-card-foreground">
          {t("team.update")}
        </button>
        <button className="rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-muted-foreground">
          {t("team.complete")}
        </button>
      </div>
    </Panel>
  );
}
