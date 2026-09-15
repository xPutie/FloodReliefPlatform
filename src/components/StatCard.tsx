import type React from "react";

type Tone = "default" | "coral" | "amber" | "cyan" | "mint" | "violet";

const toneClass: Record<Tone, string> = {
  default: "text-slate-900",
  coral: "text-red-600",
  amber: "text-amber-600",
  cyan: "text-sky-600",
  mint: "text-emerald-600",
  violet: "text-blue-600",
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold tracking-tight ${toneClass[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
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
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{title}</p>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
