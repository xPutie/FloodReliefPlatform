import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SmsFallback } from "@/components/SmsFallback";
import { t } from "@/lib/i18n";
import { requests, statusKey, type RequestStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gửi yêu cầu cứu hộ — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Người dân vùng lũ gửi yêu cầu cứu hộ chỉ với một nút bấm: chia sẻ vị trí, số người cần hỗ trợ và theo dõi trạng thái cứu hộ.",
      },
      { property: "og:title", content: "Gửi yêu cầu cứu hộ — Cứu Hộ Lũ" },
      {
        property: "og:description",
        content: "Một nút bấm để gọi đội cứu hộ gần nhất và theo dõi tiến trình cứu hộ.",
      },
    ],
  }),
  component: CitizenPage,
});

const steps: RequestStatus[] = ["pending", "verified", "searching", "assigned", "rescuing", "done"];

function CitizenPage() {
  const [people, setPeople] = useState(3);
  const [groups, setGroups] = useState<string[]>(["children"]);
  const [sent, setSent] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const current = 4; // Đang cứu hộ


  const toggle = (key: string) =>
    setGroups((g) => (g.includes(key) ? g.filter((x) => x !== key) : [...g, key]));

  const tracked = requests[4];

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:max-w-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
        {t("nav.citizen")} · Đà Nẵng
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-card-foreground">
        {t("citizen.title")}
      </h1>

      <button
        type="button"
        onClick={() => setSent(true)}
        className="glow-red mt-5 w-full animate-pulse rounded-3xl bg-coral py-8 font-display text-2xl font-bold tracking-tight text-primary-foreground transition-transform active:scale-[0.98]"
      >
        {sent ? t("citizen.submitted") : t("citizen.cta")}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">{t("citizen.ctaHint")}</p>

      <button
        type="button"
        onClick={() => setShowSms(true)}
        className="mt-3 w-full rounded-xl border border-cyan/40 bg-cyan/10 py-2.5 text-center text-sm font-semibold text-cyan"
      >
        {t("citizen.smsAction")}
      </button>


      <div className="mt-5 space-y-3">
        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
          <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-mint" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-card-foreground">{t("citizen.shareLocation")}</p>
            <p className="truncate text-xs text-muted-foreground">
              Phường Hòa Cường Nam, Hải Châu, Đà Nẵng
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-card-foreground">{t("citizen.peopleCount")}</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[1, 3, 5, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPeople(n)}
                className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                  people === n
                    ? "bg-violet text-primary-foreground"
                    : "border border-border bg-white/[0.03] text-muted-foreground"
                }`}
              >
                {n}
                {n === 8 ? "+" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-card-foreground">{t("citizen.vulnerable")}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { key: "children", label: t("citizen.children") },
              { key: "elderly", label: t("citizen.elderly") },
              { key: "injured", label: t("citizen.injured") },
            ].map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => toggle(g.key)}
                className={`rounded-xl px-2 py-3 text-[13px] font-semibold transition-colors ${
                  groups.includes(g.key)
                    ? "bg-amber text-accent-foreground"
                    : "border border-border bg-white/[0.03] text-muted-foreground"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl px-4 py-3">
          <label className="text-sm font-semibold text-card-foreground" htmlFor="mo-ta">
            {t("citizen.describe")}
          </label>
          <textarea
            id="mo-ta"
            rows={3}
            placeholder={t("citizen.describePlaceholder")}
            className="mt-2 w-full resize-none rounded-xl border border-input bg-white/[0.03] px-3 py-2 text-sm text-card-foreground outline-none placeholder:text-faint focus:border-violet"
          />
        </div>

        <div className="glass rounded-2xl px-4 py-4 text-center">
          <p className="text-sm font-semibold text-card-foreground">📷 {t("citizen.photo")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("citizen.photoHint")}</p>
        </div>

        <a
          href="tel:112"
          className="block rounded-2xl border border-cyan/40 bg-cyan/10 py-3 text-center text-sm font-semibold text-cyan"
        >
          ☎ {t("citizen.hotline")}
        </a>
      </div>

      <section className="glass mt-6 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-card-foreground">{t("citizen.tracking")}</p>
          <span className="text-[11px] text-faint">#{tracked.id}</span>
        </div>

        <ol className="mt-4 space-y-4 pl-6">
          {steps.map((s, i) => (
            <li key={s} className="relative">
              <span
                className={`absolute -left-6 top-0.5 grid size-4 place-items-center rounded-full text-[8px] ${
                  i < current
                    ? "bg-mint text-accent-foreground"
                    : i === current
                      ? "bg-coral text-primary-foreground"
                      : "border-2 border-border"
                }`}
              >
                {i < current ? "✓" : ""}
              </span>
              <p
                className={`text-sm ${
                  i === current
                    ? "font-bold text-coral"
                    : i < current
                      ? "font-semibold text-card-foreground"
                      : "text-faint"
                }`}
              >
                {t(statusKey[s])}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-xl border border-border bg-white/[0.03] p-3">
          <p className="text-xs text-muted-foreground">{t("citizen.assignedTeam")}</p>
          <p className="mt-1 text-sm font-semibold text-card-foreground">
            Đội 03 — Sông Thu Bồn · Canoe 02
          </p>
          <p className="text-xs text-muted-foreground">4 {t("common.members")} · Dự kiến đến trong 12 phút</p>
        </div>
      </section>

      <SmsFallback open={showSms} onClose={() => setShowSms(false)} />
    </main>
  );
}
