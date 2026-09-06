import { t } from "@/lib/i18n";

/**
 * Informational SMS fallback. Explains that SMS works when there is mobile
 * signal but no Internet, shows a mock emergency SMS number and an example
 * message format, and offers a button that opens the device's SMS app via an
 * `sms:` link. No real SMS sending is implemented — this is mock interaction.
 */
export function SmsFallback({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const mockNumber = "1900 1122";
  const example = "CUUHO|4|tre em|Phường Hòa Cường Nam, Hải Châu, Đà Nẵng";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("citizen.sms.title")}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-md rounded-3xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-card-foreground">
            {t("citizen.sms.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-card-foreground"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{t("citizen.sms.intro")}</p>

        <div className="mt-4 rounded-xl border border-cyan/40 bg-cyan/10 p-3">
          <p className="text-xs text-cyan">{t("citizen.sms.number")}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-cyan">
            {mockNumber}
          </p>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-white/[0.03] p-3">
          <p className="text-xs text-muted-foreground">{t("citizen.sms.format")}</p>
          <p className="mt-1 font-mono text-sm text-card-foreground">
            {t("citizen.sms.formatExample")}
          </p>
          <p className="mt-2 text-[11px] text-faint">{t("citizen.sms.formatHint")}</p>
          <div className="mt-2 rounded-lg bg-black/40 px-2 py-1 font-mono text-xs text-mint">
            {example}
          </div>
        </div>

        <a
          href={`sms:${mockNumber.replace(/\s/g, "")}?body=${encodeURIComponent(example)}`}
          className="mt-4 block rounded-2xl bg-violet py-3 text-center text-sm font-bold tracking-tight text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {t("citizen.sms.openApp")}
        </a>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl border border-border bg-white/[0.03] py-2.5 text-center text-sm font-semibold text-muted-foreground"
        >
          {t("citizen.sms.close")}
        </button>
      </div>
    </div>
  );
}
