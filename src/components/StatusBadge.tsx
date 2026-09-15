import { t } from "@/lib/i18n";
import { priorityKey, statusKey, type Priority, type RequestStatus } from "@/lib/mock-data";

// Map backend Prisma statuses and legacy mock statuses to serious, professional enterprise UI styles
const statusMap: Record<string, { label: string; dotClass: string; className: string }> = {
  // Prisma Backend Enums
  CREATED: { label: "Mới gửi", dotClass: "bg-blue-500 animate-pulse", className: "bg-blue-50 border border-blue-200 text-blue-800 font-semibold" },
  VERIFYING: { label: "Đang xác minh", dotClass: "bg-indigo-500", className: "bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold" },
  INVALID: { label: "Không hợp lệ", dotClass: "bg-rose-500", className: "bg-rose-50 border border-rose-200 text-rose-700 font-medium" },
  VERIFIED: { label: "Đã xác minh", dotClass: "bg-sky-500", className: "bg-sky-50 border border-sky-200 text-sky-800 font-semibold" },
  PRIORITIZED: { label: "Đã xếp ưu tiên", dotClass: "bg-purple-500", className: "bg-purple-50 border border-purple-200 text-purple-800 font-semibold" },
  WAITING_FOR_TEAM: { label: "Chờ đội cứu hộ", dotClass: "bg-amber-500", className: "bg-amber-50 border border-amber-200 text-amber-900 font-semibold" },
  ASSIGNED: { label: "Đã phân công", dotClass: "bg-teal-500", className: "bg-teal-50 border border-teal-200 text-teal-900 font-semibold" },
  ACCEPTED: { label: "Đội đã nhận", dotClass: "bg-cyan-500", className: "bg-cyan-50 border border-cyan-200 text-cyan-900 font-semibold" },
  IN_PROGRESS: { label: "Đang cứu hộ", dotClass: "bg-amber-500 animate-ping", className: "bg-amber-500 text-white font-bold tracking-wide shadow-xs" },
  COMPLETED: { label: "Hoàn tất cứu hộ", dotClass: "bg-emerald-400", className: "bg-emerald-700 text-white font-bold tracking-wide shadow-xs" },
  RESCUE_FAILED: { label: "Cứu hộ thất bại", dotClass: "bg-rose-400", className: "bg-rose-700 text-white font-bold tracking-wide shadow-xs" },
  CANCELLED: { label: "Đã hủy", dotClass: "bg-slate-400", className: "bg-slate-100 border border-slate-200 text-slate-600 font-medium" },

  // Legacy Mock Statuses
  pending: { label: "Chờ xác minh", dotClass: "bg-amber-500", className: "bg-amber-50 border border-amber-200 text-amber-800" },
  verified: { label: "Đã xác minh", dotClass: "bg-blue-500", className: "bg-blue-50 border border-blue-200 text-blue-800" },
  searching: { label: "Tìm đội cứu hộ", dotClass: "bg-sky-500", className: "bg-sky-50 border border-sky-200 text-sky-800" },
  assigned: { label: "Đã phân công", dotClass: "bg-indigo-500", className: "bg-indigo-50 border border-indigo-200 text-indigo-800" },
  rescuing: { label: "Đang cứu hộ", dotClass: "bg-amber-400 animate-ping", className: "bg-amber-600 text-white font-semibold" },
  done: { label: "Hoàn tất", dotClass: "bg-emerald-400", className: "bg-emerald-700 text-white font-semibold" },
};

const priorityMap: Record<string, { label: string; className: string }> = {
  // Prisma Backend Enums
  CRITICAL: { label: "KHẨN CẤP", className: "bg-red-700 text-white font-extrabold uppercase tracking-wider px-3 py-0.5 shadow-2xs border border-red-800" },
  HIGH: { label: "Ưu tiên cao", className: "bg-amber-600 text-white font-bold px-2.5 py-0.5 shadow-2xs" },
  MEDIUM: { label: "Trung bình", className: "bg-slate-100 border border-slate-300 text-slate-800 font-semibold px-2.5 py-0.5" },
  LOW: { label: "Thấp", className: "bg-slate-50 border border-slate-200 text-slate-600 font-medium px-2 py-0.5" },

  // Legacy Mock Priorities
  critical: { label: "KHẨN CẤP", className: "bg-red-700 text-white font-extrabold uppercase tracking-wider px-3 py-0.5" },
  high: { label: "Ưu tiên cao", className: "bg-amber-600 text-white font-bold px-2.5 py-0.5" },
  medium: { label: "Trung bình", className: "bg-slate-100 border border-slate-300 text-slate-800 px-2.5 py-0.5" },
  low: { label: "Thấp", className: "bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5" },
};

export function StatusBadge({ status }: { status: RequestStatus | string }) {
  const config = statusMap[status] || {
    label: t(statusKey[status as RequestStatus]) || status,
    dotClass: "bg-slate-400",
    className: "bg-slate-100 border border-slate-200 text-slate-700 font-medium",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs transition-all ${config.className}`}>
      <span className={`size-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority | string | null }) {
  if (!priority) {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500 font-medium">
        Chưa phân loại
      </span>
    );
  }

  const config = priorityMap[priority] || {
    label: t(priorityKey[priority as Priority]) || priority,
    className: "bg-slate-100 border border-slate-200 text-slate-700",
  };

  return (
    <span className={`inline-flex items-center rounded-md text-xs transition-all ${config.className}`}>
      {config.label}
    </span>
  );
}
