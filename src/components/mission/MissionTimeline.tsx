import React from "react";

export interface MissionTimelineProps {
  requestStatus?: string | undefined;
  assignmentStatus?: string | undefined;
  createdAt?: string | Date | null | undefined;
  verifiedAt?: string | Date | null | undefined;
  assignedAt?: string | Date | null | undefined;
  acceptedAt?: string | Date | null | undefined;
  startedAt?: string | Date | null | undefined;
  completedAt?: string | Date | null | undefined;
  failedAt?: string | Date | null | undefined;
}

interface StageStep {
  key: string;
  label: string;
  active: boolean;
  done: boolean;
  failed?: boolean;
  timestamp?: string | null;
}

export function MissionTimeline({
  requestStatus = "CREATED",
  assignmentStatus,
  createdAt,
  assignedAt,
  acceptedAt,
  startedAt,
  completedAt,
  failedAt,
}: MissionTimelineProps) {
  // Determine current active stage index
  let stageIndex = 0;
  let isFailed = requestStatus === "RESCUE_FAILED" || assignmentStatus === "FAILED";

  if (isFailed) {
    stageIndex = 6;
  } else if (requestStatus === "COMPLETED" || assignmentStatus === "COMPLETED") {
    stageIndex = 6;
  } else if (requestStatus === "IN_PROGRESS") {
    stageIndex = 5;
  } else if (assignmentStatus === "ACCEPTED" || requestStatus === "ACCEPTED") {
    stageIndex = 4;
  } else if (assignmentStatus === "ASSIGNED" || requestStatus === "ASSIGNED") {
    stageIndex = 3;
  } else if (requestStatus === "PRIORITIZED" || requestStatus === "WAITING_FOR_TEAM") {
    stageIndex = 2;
  } else if (requestStatus === "VERIFIED") {
    stageIndex = 1;
  } else {
    stageIndex = 0; // CREATED
  }

  const formatTime = (dt?: string | Date | null) => {
    if (!dt) return "Chưa ghi nhận";
    try {
      return new Date(dt).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "Chưa ghi nhận";
    }
  };

  const steps: StageStep[] = [
    {
      key: "CREATED",
      label: "Mới gửi",
      active: stageIndex === 0,
      done: stageIndex > 0,
      timestamp: formatTime(createdAt),
    },
    {
      key: "VERIFIED",
      label: "Đã xác minh",
      active: stageIndex === 1,
      done: stageIndex > 1,
      timestamp: stageIndex >= 1 ? "Đã xác minh" : "Chưa ghi nhận",
    },
    {
      key: "PRIORITIZED",
      label: "Đã ưu tiên",
      active: stageIndex === 2,
      done: stageIndex > 2,
      timestamp: stageIndex >= 2 ? "Đã xếp lịch" : "Chưa ghi nhận",
    },
    {
      key: "ASSIGNED",
      label: "Đã phân công",
      active: stageIndex === 3,
      done: stageIndex > 3,
      timestamp: formatTime(assignedAt),
    },
    {
      key: "ACCEPTED",
      label: "Đội phản hồi",
      active: stageIndex === 4,
      done: stageIndex > 4,
      timestamp: formatTime(acceptedAt),
    },
    {
      key: "IN_PROGRESS",
      label: "Đang cứu hộ",
      active: stageIndex === 5,
      done: stageIndex > 5,
      timestamp: formatTime(startedAt),
    },
    {
      key: isFailed ? "FAILED" : "COMPLETED",
      label: isFailed ? "Thất bại / Hủy" : "Hoàn thành",
      active: stageIndex === 6,
      done: stageIndex === 6,
      failed: isFailed,
      timestamp: isFailed ? formatTime(failedAt) : formatTime(completedAt),
    },
  ];

  return (
    <div className="w-full space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span>⏱️ TIẾN TRÌNH NHIỆM VỤ (MISSION TIMELINE)</span>
        </h4>
        <span className="text-[11px] font-mono text-slate-500">
          Trạng thái: <strong>{requestStatus}</strong> {assignmentStatus ? `(${assignmentStatus})` : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
        {steps.map((step, idx) => {
          let badgeBg = "bg-slate-100 text-slate-500 border-slate-200";
          if (step.failed) {
            badgeBg = "bg-red-600 text-white border-red-700 font-bold";
          } else if (step.active) {
            badgeBg = "bg-blue-600 text-white border-blue-700 font-bold shadow-xs";
          } else if (step.done) {
            badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold";
          }

          return (
            <div key={step.key} className="flex flex-col space-y-1 text-center">
              <div className={`rounded-lg border px-2 py-1.5 text-xs transition-all ${badgeBg}`}>
                <div className="flex items-center justify-center gap-1">
                  <span>{step.done ? "✓" : step.active ? "●" : `${idx + 1}`}</span>
                  <span className="truncate">{step.label}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono truncate">
                {step.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
