import { createFileRoute } from "@tanstack/react-router";
import { Panel, StatCard } from "@/components/StatCard";
import { t } from "@/lib/i18n";
import { distributions, donations, reliefItems, warehouses } from "@/lib/mock-data";

export const Route = createFileRoute("/cuu-tro")({
  head: () => ({
    meta: [
      { title: "Quản lý cứu trợ — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Quản lý kho cứu trợ, nguồn hàng (nước, lương thực, thuốc, chăn màn), tiếp nhận quyên góp và theo dõi phân bổ.",
      },
      { property: "og:title", content: "Quản lý cứu trợ — Cứu Hộ Lũ" },
      {
        property: "og:description",
        content: "Theo dõi kho cứu trợ, quyên góp và phân bổ đến các khu vực bị lũ.",
      },
    ],
  }),
  component: ReliefPage,
});

function ReliefPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
          {t("coordinator.region")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-card-foreground">
          {t("relief.title")}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {reliefItems.map((item) => (
          <StatCard
            key={item.id}
            label={`${item.icon} ${t(item.labelKey)}`}
            value={`${item.stock.toLocaleString("vi-VN")}`}
            hint={`${item.unit} · đã phân ${item.allocated.toLocaleString("vi-VN")}`}
            tone="cyan"
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title={t("relief.warehouses")} className="lg:col-span-1">
          <ul className="space-y-3">
            {warehouses.map((w) => (
              <li
                key={w.id}
                className="rounded-xl border border-border bg-white/[0.03] p-3"
              >
                <p className="text-sm font-semibold text-card-foreground">{w.name}</p>
                <p className="text-xs text-muted-foreground">{w.area}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-violet"
                    style={{ width: `${w.capacity}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-faint">Mức tồn {w.capacity}%</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t("relief.donations")} className="lg:col-span-2">
          <div className="space-y-3">
            {donations.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.03] p-3"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet to-cyan text-sm">
                  ❤️
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{d.donor}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.item}</p>
                </div>
                <span className="shrink-0 text-[11px] text-faint">{d.time}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title={t("relief.distribution")} className="lg:col-span-3">
          <div className="space-y-3">
            {distributions.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white/[0.03] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{p.area}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.item}</p>
                </div>
                <div className="w-40">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${
                        p.progress === 100 ? "bg-mint" : "bg-gradient-to-r from-cyan to-violet"
                      }`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[11px] text-faint">{p.progress}%</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
