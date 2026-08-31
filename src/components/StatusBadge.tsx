import { t } from "@/lib/i18n";
import { priorityKey, statusKey, type Priority, type RequestStatus } from "@/lib/mock-data";

const statusClass: Record<RequestStatus, string> = {
  pending: "bg-coral/20 text-coral",
  verified: "bg-violet/20 text-glow",
  searching: "bg-amber/20 text-amber",
  assigned: "bg-cyan/20 text-cyan",
  rescuing: "bg-amber/20 text-amber",
  done: "bg-mint/20 text-mint",
  cancelled: "bg-white/10 text-muted-foreground",
};

const priorityClass: Record<Priority, string> = {
  critical: "bg-coral text-primary-foreground",
  high: "bg-amber text-accent-foreground",
  medium: "bg-cyan text-accent-foreground",
  low: "bg-white/10 text-muted-foreground",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass[status]}`}>
      {t(statusKey[status])}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const label = t(priorityKey[priority]);
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${priorityClass[priority]} ${
        priority === "critical" ? "uppercase" : ""
      }`}
    >
      {label}
    </span>
  );
}
