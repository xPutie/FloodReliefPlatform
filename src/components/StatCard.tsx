type Tone = "default" | "coral" | "amber" | "cyan" | "mint" | "violet";

const toneClass: Record<Tone, string> = {
  default: "text-card-foreground",
  coral: "text-coral",
  amber: "text-amber",
  cyan: "text-cyan",
  mint: "text-mint",
  violet: "text-glow",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-4xl font-bold ${toneClass[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-card-foreground">{title}</p>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
