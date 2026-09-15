export type FreshnessState = "LIVE" | "RECENT" | "STALE";

export interface FreshnessInfo {
  state: FreshnessState;
  label: string;
  className: string;
}

export function getLocationFreshness(updatedAt?: string | Date | null): FreshnessInfo {
  if (!updatedAt) {
    return {
      state: "STALE",
      label: "🔴 Chưa có vị trí",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  const updatedTime = new Date(updatedAt).getTime();
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - updatedTime) / 1000));

  if (diffSeconds < 60) {
    return {
      state: "LIVE",
      label: "🟢 Đang cập nhật",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
    };
  }

  if (diffSeconds <= 300) {
    const mins = Math.floor(diffSeconds / 60);
    return {
      state: "RECENT",
      label: `🟠 Cập nhật ${mins} phút trước`,
      className: "bg-amber-50 text-amber-800 border-amber-200 font-medium",
    };
  }

  const mins = Math.floor(diffSeconds / 60);
  return {
    state: "STALE",
    label: `🔴 Vị trí đã cũ (${mins > 60 ? Math.floor(mins / 60) + " giờ" : mins + " phút"} trước)`,
    className: "bg-rose-50 text-rose-800 border-rose-200 font-medium",
  };
}
