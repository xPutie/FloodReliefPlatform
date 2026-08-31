import mapImage from "@/assets/map-mien-trung.jpg";
import { t } from "@/lib/i18n";
import { formatAddress, requests, teams } from "@/lib/mock-data";

const pinTone: Record<string, string> = {
  pending: "bg-coral glow-vio",
  searching: "bg-coral",
  assigned: "bg-cyan",
  rescuing: "bg-amber",
  done: "bg-mint",
  verified: "bg-violet",
  cancelled: "bg-white/40",
};

export function MapPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border ${className}`}>
      <div className="relative h-[360px] w-full bg-ink2 lg:h-[460px]">
        <img
          src={mapImage}
          alt="Bản đồ khu vực miền Trung với các điểm yêu cầu cứu hộ"
          width={1536}
          height={768}
          className="absolute inset-0 size-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink2 via-ink to-ink opacity-80" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklab, var(--violet) 12%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--violet) 12%, transparent) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />

        {requests.map((r) => (
          <div key={r.id}>
            <div
              className={`absolute size-3 rounded-full ${pinTone[r.status]}`}
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
            />
            <div
              className="absolute max-w-[46%] truncate rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-card-foreground"
              style={{ left: `${Math.max(r.x - 2, 1)}%`, top: `${r.y + 6}%` }}
            >
              {formatAddress(r.address).split(",").slice(-1)[0]?.trim()} · {r.people} {t("common.people")}
            </div>
          </div>
        ))}

        <div className="absolute right-4 top-16 space-y-1">
          {teams.slice(0, 2).map((team) => (
            <div
              key={team.id}
              className="rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-cyan"
            >
              {team.name.split("—")[0]?.trim()} · {team.vehicle}
            </div>
          ))}
        </div>

        <div className="glass absolute left-4 top-4 rounded-lg px-3 py-2 text-xs font-semibold text-card-foreground">
          {t("coordinator.map")}
        </div>

        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-muted-foreground">
            <span className="size-2 rounded-full bg-coral" />
            {t("status.pending")}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-muted-foreground">
            <span className="size-2 rounded-full bg-amber" />
            {t("status.rescuing")}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-muted-foreground">
            <span className="size-2 rounded-full bg-cyan" />
            {t("nav.team")}
          </span>
        </div>
      </div>
    </div>
  );
}
