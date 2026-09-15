import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/auth/AuthContext";
import { RescueMap } from "@/components/map/RescueMap";
import { MissionTimeline } from "@/components/mission/MissionTimeline";
import { getCurrentBrowserLocation, getAccuracyRating } from "@/lib/location/geolocation";
import { getLocationFreshness } from "@/lib/location/location-freshness";
import { calculateHaversineDistance, formatDistanceLabel } from "@/lib/location/distance";

const API_BASE = "http://localhost:3000";

export interface RescueTeam {
  id: string;
  name: string;
  leaderName?: string;
  phone?: string;
  capacity?: number;
  capability?: string;
  status: "AVAILABLE" | "ON_MISSION" | "OFFLINE" | string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  locationAccuracy?: number | null;
  locationUpdatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RescueRequest {
  id: string;
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  peopleCount: number;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  rescueRequestId: string;
  rescueTeamId: string;
  status: "ASSIGNED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "FAILED" | string;
  assignedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
  rescueRequest: RescueRequest;
  rescueTeam: RescueTeam;
}

export const Route = createFileRoute("/doi-cuu-ho")({
  head: () => ({
    meta: [
      { title: "Bảng Điều Phối Đội Cứu Hộ — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Quản lý nhiệm vụ, chia sẻ vị trí live GPS và thực hiện cứu hộ theo thời gian thực.",
      },
    ],
  }),
  component: RescueTeamDashboardPage,
});

function RescueTeamDashboardPage() {
  const { getAuthHeaders } = useAuth();

  // Teams and Selected Team State
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  
  // Assignments and Requests
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Location Sharing & GPS Watcher State
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [teamCoords, setTeamCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number | undefined;
    updatedAt?: string | undefined;
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  
  // Selected Mission for Detail Modal
  const [selectedMission, setSelectedMission] = useState<Assignment | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant?: "danger" | "warning" | "primary";
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Xác nhận",
    onConfirm: async () => {},
  });

  // Filter tab for missions list
  const [missionFilter, setMissionFilter] = useState<"ALL" | "ACTIVE" | "DONE">("ACTIVE");
  const [gpsSyncStatus, setGpsSyncStatus] = useState<"SYNCED" | "UNSYNCED" | "ERROR">("SYNCED");

  // Sync team location to backend API
  const syncLocationToBackend = async (lat: number, lng: number, acc?: number) => {
    try {
      const res = await fetch(`${API_BASE}/rescue-teams/me/location`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedAt = data.location?.updatedAt || new Date().toISOString();
        setTeamCoords({ latitude: lat, longitude: lng, accuracy: acc, updatedAt });
        lastSyncTimeRef.current = Date.now();
        setGpsSyncStatus("SYNCED");
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn("Failed to sync team location to server:", errJson.message || res.statusText);
        setGpsSyncStatus("UNSYNCED");
      }
    } catch (err) {
      console.error("Location sync network error:", err);
      setGpsSyncStatus("UNSYNCED");
    }
  };

  // Start continuous location sharing (watchPosition + debounced backend sync)
  const startLocationSharing = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      // 1. Initial location fetch
      const coords = await getCurrentBrowserLocation();
      setTeamCoords({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        updatedAt: new Date().toISOString(),
      });
      await syncLocationToBackend(coords.latitude, coords.longitude, coords.accuracy);
      setIsSharingLocation(true);

      // 2. Start continuous watcher if available
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            const acc = Math.round(pos.coords.accuracy);

            setTeamCoords({
              latitude: lat,
              longitude: lng,
              accuracy: acc,
              updatedAt: new Date().toISOString(),
            });

            // Throttle backend syncs (every 15s or on major movement)
            const now = Date.now();
            if (now - lastSyncTimeRef.current > 15000) {
              syncLocationToBackend(lat, lng, acc);
            }
          },
          (err) => {
            console.warn("GPS watch position warning:", err.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000,
          }
        );
      }
    } catch (err: any) {
      setLocationError(err.message || "Không thể lấy vị trí GPS. Vui lòng cho phép truy cập vị trí.");
      setIsSharingLocation(false);
    } finally {
      setLocationLoading(false);
    }
  };

  // Stop location sharing watcher
  const stopLocationSharing = () => {
    if (watchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharingLocation(false);
  };

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch initial teams and assignments
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Teams
      const resTeams = await fetch(`${API_BASE}/rescue-teams`);
      if (!resTeams.ok) throw new Error("Không thể tải danh sách đội cứu hộ");
      const teamsData: RescueTeam[] = await resTeams.json();
      setTeams(teamsData);

      // Auto-select first team if none selected
      if (teamsData.length > 0 && !selectedTeamId) {
        const savedTeamId = localStorage.getItem("selected_rescue_team_id");
        if (savedTeamId && teamsData.some((t) => t.id === savedTeamId)) {
          setSelectedTeamId(savedTeamId);
        } else if (teamsData[0]?.id) {
          setSelectedTeamId(teamsData[0].id);
        }
      }

      // 2. Fetch All Assignments
      const resAssignments = await fetch(`${API_BASE}/assignments`);
      if (!resAssignments.ok) throw new Error("Không thể tải danh sách nhiệm vụ");
      const assignmentsData: Assignment[] = await resAssignments.json();
      setAssignments(assignmentsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Team Selection Switch
  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    localStorage.setItem("selected_rescue_team_id", teamId);
  };

  // Selected Team Object
  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  // Filter assignments for selected team
  const teamAssignments = useMemo(() => {
    if (!selectedTeamId) return [];
    return assignments.filter((a) => a.rescueTeamId === selectedTeamId);
  }, [assignments, selectedTeamId]);

  // Current active mission (ASSIGNED, ACCEPTED, or Request IN_PROGRESS)
  const activeMission = useMemo(() => {
    return teamAssignments.find((a) => {
      const isAssignmentActive = a.status === "ASSIGNED" || a.status === "ACCEPTED";
      const isRequestIncomplete = a.rescueRequest?.status !== "COMPLETED" && a.rescueRequest?.status !== "RESCUE_FAILED" && a.rescueRequest?.status !== "CANCELLED";
      return isAssignmentActive && isRequestIncomplete;
    }) || null;
  }, [teamAssignments]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = teamAssignments.length;
    const pendingAccept = teamAssignments.filter((a) => a.status === "ASSIGNED").length;
    const inProgress = teamAssignments.filter(
      (a) => a.status === "ACCEPTED" && a.rescueRequest?.status === "IN_PROGRESS"
    ).length;
    const completed = teamAssignments.filter(
      (a) => a.status === "COMPLETED" || a.rescueRequest?.status === "COMPLETED"
    ).length;

    return { total, pendingAccept, inProgress, completed };
  }, [teamAssignments]);

  // Filtered mission list for display
  const filteredMissions = useMemo(() => {
    if (missionFilter === "ACTIVE") {
      return teamAssignments.filter((a) => a.status === "ASSIGNED" || a.status === "ACCEPTED");
    }
    if (missionFilter === "DONE") {
      return teamAssignments.filter((a) => a.status === "COMPLETED" || a.status === "FAILED" || a.status === "REJECTED");
    }
    return teamAssignments;
  }, [teamAssignments, missionFilter]);

  // Helper for notification toast
  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 4000);
  };

  // --- ACTIONS ---

  // Accept Assignment
  const handleAcceptAssignment = async (assignmentId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/assignments/${assignmentId}/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ decision: "ACCEPT" }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể tiếp nhận nhiệm vụ.");
      }

      showToast("Đã tiếp nhận nhiệm vụ thành công!");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Assignment
  const handleRejectAssignment = (assignmentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Từ chối nhiệm vụ?",
      description:
        "Bạn có chắc muốn từ chối nhiệm vụ này? Yêu cầu cứu hộ sẽ được chuyển về trạng thái 'Chờ đội cứu hộ' để điều phối viên phân công lại.",
      confirmText: "Xác nhận từ chối",
      variant: "danger",
      onConfirm: async () => {
        setActionLoading(true);
        setError(null);
        try {
          const res = await fetch(`${API_BASE}/assignments/${assignmentId}/respond`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify({ decision: "REJECT" }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || "Không thể từ chối nhiệm vụ.");
          }

          showToast("Đã từ chối nhiệm vụ. Yêu cầu đã được chuyển về trạng thái chờ phân công lại.");
          await fetchData();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Start Rescue Mission
  const handleStartMission = async (assignmentId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/assignments/${assignmentId}/start`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể bắt đầu cứu hộ.");
      }

      showToast("Đã bắt đầu thực hiện cứu hộ!");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Mission
  const handleCompleteMission = (assignmentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xác nhận hoàn tất cứu hộ",
      description:
        "Thao tác này sẽ đánh dấu yêu cầu là đã hoàn thành và đưa đội cứu hộ về trạng thái 'Sẵn sàng'. Bạn có chắc chắn?",
      confirmText: "Hoàn tất cứu hộ",
      variant: "primary",
      onConfirm: async () => {
        setActionLoading(true);
        setError(null);
        try {
          const res = await fetch(`${API_BASE}/assignments/${assignmentId}/complete`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
            },
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || "Không thể hoàn tất cứu hộ.");
          }

          showToast("🎉 Hoàn tất cứu hộ thành công! Đội cứu hộ đã sẵn sàng cho nhiệm vụ mới.");
          await fetchData();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Fail Mission
  const handleFailMission = (assignmentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xác nhận báo cáo thất bại",
      description:
        "Nhiệm vụ sẽ được đánh dấu là FAILED và yêu cầu cứu hộ chuyển sang RESCUE_FAILED. Bạn có chắc muốn báo cáo thất bại?",
      confirmText: "Báo cáo thất bại",
      variant: "danger",
      onConfirm: async () => {
        setActionLoading(true);
        setError(null);
        try {
          const res = await fetch(`${API_BASE}/assignments/${assignmentId}/fail`, {
            method: "PATCH",
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || "Không thể gửi báo cáo thất bại.");
          }

          showToast("Đã ghi nhận báo cáo cứu hộ thất bại.");
          await fetchData();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Toast feedback */}
        {actionSuccessMsg && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 shadow-sm transition-all flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <span>✓</span>
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Global API Error */}
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-900 font-bold text-sm"
            >
              Đóng
            </button>
          </div>
        )}

        {/* PART 1 — HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Đội cứu hộ
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                ● HỆ THỐNG ĐANG HOẠT ĐỘNG
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý nhiệm vụ và cập nhật trạng thái cứu hộ theo thời gian thực.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <span className={loading ? "animate-spin" : ""}>↻</span>
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* PART 2 — RESCUE TEAM CONTEXT SELECTOR & STATUS CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
            {/* Team Context Selector */}
            <div className="space-y-1">
              <label htmlFor="team-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Đội đang thao tác (Demo Context)
              </label>
              <div className="relative">
                <select
                  id="team-select"
                  value={selectedTeamId}
                  onChange={(e) => handleSelectTeam(e.target.value)}
                  className="w-full sm:w-80 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {teams.length === 0 ? (
                    <option value="">Chưa có đội cứu hộ</option>
                  ) : (
                    teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({formatTeamStatus(t.status)})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Current Team Detailed Info */}
            {currentTeam && (
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
                <div>
                  <span className="block text-xs text-slate-500">Trạng thái đội</span>
                  <span className="mt-0.5 inline-block">
                    <TeamStatusBadge status={currentTeam.status} />
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Sức chứa</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {currentTeam.capacity ? `${currentTeam.capacity} người` : "Không rõ"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Năng lực / Phương tiện</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {currentTeam.capability || "Chưa cập nhật"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PART 2.1 — TEAM LIVE GPS LOCATION SHARING CARD */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📍 VỊ TRÍ ĐỘI CỨU HỘ</span>
                  {isSharingLocation ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
                      🟢 Đang chia sẻ vị trí
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                      Chưa chia sẻ vị trí
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chia sẻ vị trí hiện tại để trung tâm điều phối biết đội cứu hộ đang ở đâu.
                </p>
              </div>

              {/* Location Sharing Toggle Button */}
              <div>
                {isSharingLocation ? (
                  <button
                    type="button"
                    onClick={stopLocationSharing}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-all shadow-2xs"
                  >
                    <span>⏹️ Tắt chia sẻ vị trí</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={locationLoading}
                    onClick={startLocationSharing}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    {locationLoading ? (
                      <>
                        <span className="animate-spin">↻</span>
                        <span>Đang xác định vị trí...</span>
                      </>
                    ) : (
                      <>
                        <span>📍</span>
                        <span>Chia sẻ vị trí hiện tại</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {locationError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-900 font-medium flex items-center gap-2">
                <span>⚠️</span> <span>{locationError}</span>
              </div>
            )}

            {/* Location Data Output / Status Guidance */}
            {teamCoords ? (
              <div className="space-y-2">
                {gpsSyncStatus === "UNSYNCED" && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs font-semibold text-amber-900 flex items-center gap-2">
                    <span>⚠️ Chưa đồng bộ vị trí máy chủ (Thử lại ở lượt GPS tiếp theo).</span>
                  </div>
                )}
                {teamCoords.accuracy && teamCoords.accuracy > 100 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 font-medium">
                    ⚠️ Độ chính xác GPS thấp (~{teamCoords.accuracy}m). Vui lòng di chuyển ra nơi thông thoáng.
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-slate-700">Tọa độ GPS:</span>
                    <code className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {teamCoords.latitude}, {teamCoords.longitude}
                    </code>
                    {teamCoords.accuracy && (
                      <span className="text-slate-600">
                        (Độ chính xác: ~{teamCoords.accuracy}m)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs ${getLocationFreshness(teamCoords.updatedAt).className}`}>
                      {getLocationFreshness(teamCoords.updatedAt).label}
                    </span>
                    {teamCoords.updatedAt && (
                      <span className="text-[11px] text-slate-500">
                        Vị trí cuối cùng: {new Date(teamCoords.updatedAt).toLocaleTimeString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Chưa có dữ liệu GPS. Nhấn "Chia sẻ vị trí hiện tại" để bắt đầu phát tín hiệu vị trí live đến trung tâm điều phối.
              </p>
            )}
          </div>

          {/* PART 2.2 — OPERATIONAL TACTICAL MAP */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>🗺️ BẢN ĐỒ TÁC CHIẾN ĐỘI CỨU HỘ</span>
              </span>
              <span>© OpenStreetMap</span>
            </div>

            <RescueMap
              autoFitBounds
              center={
                teamCoords
                  ? [teamCoords.latitude, teamCoords.longitude]
                  : activeMission?.rescueRequest?.latitude && activeMission?.rescueRequest?.longitude
                  ? [Number(activeMission.rescueRequest.latitude), Number(activeMission.rescueRequest.longitude)]
                  : [16.047079, 108.20623]
              }
              zoom={teamCoords ? 15 : 12}
              markers={[
                ...(teamCoords
                  ? [
                      {
                        id: `team-${selectedTeamId}`,
                        latitude: teamCoords.latitude,
                        longitude: teamCoords.longitude,
                        type: "TEAM" as const,
                        title: currentTeam?.name || "Vị trí Đội Cứu Hộ",
                        popupContent: `
                          <div style="font-family: sans-serif; font-size: 12px; min-width: 170px;">
                            <div style="font-weight: bold; color: #059669; margin-bottom: 4px;">🚤 ${currentTeam?.name || "Đội Cứu Hộ"}</div>
                            <div>Trạng thái: <b>${formatTeamStatus(currentTeam?.status || "AVAILABLE")}</b></div>
                            ${teamCoords.accuracy ? `<div>Độ chính xác: ~${teamCoords.accuracy}m</div>` : ""}
                            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Cập nhật lúc: ${new Date().toLocaleTimeString("vi-VN")}</div>
                          </div>
                        `,
                      },
                    ]
                  : []),
                ...(activeMission?.rescueRequest?.latitude && activeMission?.rescueRequest?.longitude
                  ? [
                      {
                        id: activeMission.rescueRequest.id,
                        latitude: Number(activeMission.rescueRequest.latitude),
                        longitude: Number(activeMission.rescueRequest.longitude),
                        type: "REQUEST" as const,
                        priority: activeMission.rescueRequest.priority,
                        status: activeMission.rescueRequest.status,
                        popupContent: `
                          <div style="font-family: sans-serif; font-size: 12px; min-width: 190px;">
                            <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">📍 Point: ${activeMission.rescueRequest.locationAddress}</div>
                            <div>👥 <b>${activeMission.rescueRequest.peopleCount} người cần cứu</b></div>
                            <div>⚡ Ưu tiên: <b>${activeMission.rescueRequest.priority || "MEDIUM"}</b></div>
                            <div style="margin-top: 6px;">
                              <a href="https://www.google.com/maps/search/?api=1&query=${activeMission.rescueRequest.latitude},${activeMission.rescueRequest.longitude}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#2563eb; color:white; font-weight:bold; padding:3px 8px; border-radius:4px; text-decoration:none; font-size:11px;">
                                🗺️ Mở chỉ đường
                              </a>
                            </div>
                          </div>
                        `,
                      },
                    ]
                  : []),
              ]}
              polyline={
                teamCoords && activeMission?.rescueRequest?.latitude && activeMission?.rescueRequest?.longitude
                  ? {
                      from: [teamCoords.latitude, teamCoords.longitude],
                      to: [
                        Number(activeMission.rescueRequest.latitude),
                        Number(activeMission.rescueRequest.longitude),
                      ],
                    }
                  : null
              }
              className="h-64 sm:h-80 w-full rounded-xl border border-slate-300 shadow-2xs"
            />
          </div>
        </div>

        {/* PART 3 — OVERVIEW STATISTICS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Nhiệm vụ hiện tại"
            value={String(activeMission ? 1 : 0)}
            hint={activeMission ? "Đang có nhiệm vụ" : "Không có nhiệm vụ active"}
          />
          <StatCard
            label="Chờ tiếp nhận"
            value={String(stats.pendingAccept)}
            hint="Nhiệm vụ vừa được phân công"
          />
          <StatCard
            label="Đang cứu hộ"
            value={String(stats.inProgress)}
            hint="Đang triển khai tại hiện trường"
          />
          <StatCard
            label="Đã hoàn thành"
            value={String(stats.completed)}
            hint="Tổng số ca cứu hộ xong"
          />
        </div>

        {/* PART 5 & 7 — ACTIVE MISSION OPERATIONAL PANEL */}
        {activeMission ? (
          <div className="rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold uppercase text-white tracking-wider">
                    🎯 NHIỆM VỤ ĐANG THỰC HIỆN
                  </span>
                  <PriorityBadge priority={activeMission.rescueRequest?.priority ?? null} />
                  <StatusBadge status={activeMission.status} />
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Địa điểm: {activeMission.rescueRequest?.locationAddress || "Chưa có địa chỉ"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  ID Yêu cầu: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-800 font-mono">{activeMission.rescueRequestId}</code> · Số người: <strong className="text-slate-900">{activeMission.rescueRequest?.peopleCount} người</strong>
                </p>
              </div>

              {/* Quick Actions in Active Panel with exact Vietnamese labels */}
              <div className="flex flex-wrap gap-2.5">
                {activeMission.status === "ASSIGNED" && (
                  <>
                    <button
                      onClick={() => handleAcceptAssignment(activeMission.id)}
                      disabled={actionLoading}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {actionLoading ? "Đang xử lý..." : "✓ Nhận nhiệm vụ"}
                    </button>
                    <button
                      onClick={() => handleRejectAssignment(activeMission.id)}
                      disabled={actionLoading}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      ✕ Từ chối nhiệm vụ
                    </button>
                  </>
                )}

                {activeMission.status === "ACCEPTED" && activeMission.rescueRequest?.status === "ACCEPTED" && (
                  <button
                    onClick={() => handleStartMission(activeMission.id)}
                    disabled={actionLoading}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {actionLoading ? "Đang xử lý..." : "▶ Bắt đầu cứu hộ"}
                  </button>
                )}

                {activeMission.status === "ACCEPTED" && activeMission.rescueRequest?.status === "IN_PROGRESS" && (
                  <>
                    <button
                      onClick={() => handleCompleteMission(activeMission.id)}
                      disabled={actionLoading}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {actionLoading ? "Đang xử lý..." : "✓ Hoàn thành"}
                    </button>
                    <button
                      onClick={() => handleFailMission(activeMission.id)}
                      disabled={actionLoading}
                      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      ✕ Báo không thể thực hiện
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Target & Distance Operational Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium block">🎯 Tọa độ nạn nhân:</span>
                <span className="font-mono font-bold text-slate-800">
                  {activeMission.rescueRequest?.latitude && activeMission.rescueRequest?.longitude
                    ? `${activeMission.rescueRequest.latitude}, ${activeMission.rescueRequest.longitude}`
                    : "Chưa có GPS"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">🚤 Vị trí GPS Đội cứu hộ:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {teamCoords ? `${teamCoords.latitude}, ${teamCoords.longitude}` : "Chưa phát tín hiệu GPS"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">📍 Khoảng cách đường chim bay:</span>
                <span className="font-bold text-blue-700 font-mono text-sm">
                  {formatDistanceLabel(
                    calculateHaversineDistance(
                      teamCoords?.latitude,
                      teamCoords?.longitude,
                      activeMission.rescueRequest?.latitude,
                      activeMission.rescueRequest?.longitude
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Description note if available */}
            {activeMission.rescueRequest?.description && (
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900">📝 Mô tả tình huống: </span>
                {activeMission.rescueRequest.description}
              </div>
            )}

            {/* Visual Mission Lifecycle Tracker */}
            <div className="space-y-2">
              <MissionTimeline
                assignmentStatus={activeMission.status}
                requestStatus={activeMission.rescueRequest?.status}
                createdAt={activeMission.rescueRequest?.createdAt}
                assignedAt={activeMission.assignedAt}
                acceptedAt={activeMission.acceptedAt}
                startedAt={activeMission.startedAt}
                completedAt={activeMission.completedAt}
                failedAt={activeMission.failedAt}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-semibold text-slate-700">
              Hiện tại đội chưa có nhiệm vụ cứu hộ active.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Vui lòng theo dõi danh sách bên dưới hoặc chờ điều phối viên phân công nhiệm vụ mới.
            </p>
          </div>
        )}

        {/* PART 4 — ASSIGNED MISSIONS LIST & FILTER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide">
                  🔒 WORKSPACE NỘI BỘ — TEAM_MEMBER
                </span>
                <span className="text-xs text-slate-500">
                  (Auth/RBAC Backend đang chờ tích hợp)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Thao tác Nhiệm vụ Đội cứu hộ
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Tiếp nhận assignment, cập nhật tiến độ cứu hộ trực tiếp và báo cáo kết quả cứu nạn.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setMissionFilter("ACTIVE")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  missionFilter === "ACTIVE"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Đang thực hiện ({teamAssignments.filter((a) => a.status === "ASSIGNED" || a.status === "ACCEPTED").length})
              </button>
              <button
                onClick={() => setMissionFilter("DONE")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  missionFilter === "DONE"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lịch sử / Đã xong ({teamAssignments.filter((a) => a.status === "COMPLETED" || a.status === "FAILED" || a.status === "REJECTED").length})
              </button>
              <button
                onClick={() => setMissionFilter("ALL")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  missionFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả ({teamAssignments.length})
              </button>
            </div>
          </div>

          {/* Table / Cards List */}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Đang tải danh sách nhiệm vụ...
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Không có nhiệm vụ nào trong danh sách này.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMissions.map((assignment) => {
                const req = assignment.rescueRequest;
                const isCritical = req?.priority === "CRITICAL";

                return (
                  <div
                    key={assignment.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isCritical
                        ? "border-l-4 border-l-red-600 border-red-200 bg-red-50/40"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Mission Info */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            Nhiệm vụ #{assignment.id.slice(0, 8)}
                          </code>
                          <PriorityBadge priority={req?.priority ?? null} />
                          <StatusBadge status={assignment.status} />
                          {req?.status && (
                            <span className="text-xs text-slate-500">
                              (Yêu cầu: <StatusBadge status={req.status} />)
                            </span>
                          )}
                        </div>

                        <p className="text-base font-bold text-slate-900">
                          📍 {req?.locationAddress || "Chưa rõ vị trí"}
                        </p>

                        <p className="text-xs text-slate-600">
                          Số người: <strong>{req?.peopleCount} người</strong> · Tạo lúc: {new Date(assignment.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>

                      {/* Actions & Detail trigger */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedMission(assignment)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          👁️ Chi tiết
                        </button>

                        {/* Inline Actions */}
                        {assignment.status === "ASSIGNED" && (
                          <>
                            <button
                              onClick={() => handleAcceptAssignment(assignment.id)}
                              disabled={actionLoading}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Tiếp nhận
                            </button>
                            <button
                              onClick={() => handleRejectAssignment(assignment.id)}
                              disabled={actionLoading}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                          </>
                        )}

                        {assignment.status === "ACCEPTED" && req?.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleStartMission(assignment.id)}
                            disabled={actionLoading}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Bắt đầu cứu hộ
                          </button>
                        )}

                        {assignment.status === "ACCEPTED" && req?.status === "IN_PROGRESS" && (
                          <>
                            <button
                              onClick={() => handleCompleteMission(assignment.id)}
                              disabled={actionLoading}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Hoàn tất
                            </button>
                            <button
                              onClick={() => handleFailMission(assignment.id)}
                              disabled={actionLoading}
                              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Thất bại
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PART 6 — MISSION DETAIL MODAL */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Chi tiết nhiệm vụ #{selectedMission.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-500">
                  Phân công cứu hộ cho {selectedMission.rescueTeam?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedMission(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Request Detail Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Thông tin yêu cầu cứu hộ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="block text-xs text-slate-500">ID Yêu cầu</span>
                  <code className="text-xs font-mono font-bold text-slate-800">{selectedMission.rescueRequestId}</code>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="block text-xs text-slate-500">Mức ưu tiên</span>
                  <div className="mt-1"><PriorityBadge priority={selectedMission.rescueRequest?.priority ?? null} /></div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 sm:col-span-2">
                  <span className="block text-xs text-slate-500">Vị trí địa lý</span>
                  <p className="font-semibold text-slate-900">{selectedMission.rescueRequest?.locationAddress}</p>
                  {(selectedMission.rescueRequest?.latitude || selectedMission.rescueRequest?.longitude) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tọa độ: {selectedMission.rescueRequest?.latitude}, {selectedMission.rescueRequest?.longitude}
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="block text-xs text-slate-500">Số lượng người cần cứu</span>
                  <p className="font-semibold text-slate-900">{selectedMission.rescueRequest?.peopleCount} người</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="block text-xs text-slate-500">Trạng thái yêu cầu</span>
                  <div className="mt-1"><StatusBadge status={selectedMission.rescueRequest?.status || "N/A"} /></div>
                </div>
              </div>

              {selectedMission.rescueRequest?.description && (
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-sm">
                  <span className="block text-xs text-slate-500 mb-1">Mô tả tình trạng</span>
                  <p className="text-slate-800">{selectedMission.rescueRequest.description}</p>
                </div>
              )}
            </div>

            {/* Assignment Section */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Thông tin phân công
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="block text-xs text-slate-500">Trạng thái phân công</span>
                  <div className="mt-1"><StatusBadge status={selectedMission.status} /></div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="block text-xs text-slate-500">Thời gian phân công</span>
                  <p className="font-medium text-slate-800">
                    {new Date(selectedMission.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMission(null)}
                className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PART 9 & 10 — CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
            <p className="text-sm text-slate-600">{confirmModal.description}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmModal.onConfirm}
                disabled={actionLoading}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  confirmModal.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {actionLoading ? "Đang xử lý..." : confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// --- HELPER COMPONENTS ---

function formatTeamStatus(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "Sẵn sàng";
    case "ON_MISSION":
      return "Đang làm nhiệm vụ";
    case "OFFLINE":
      return "Ngoại tuyến";
    default:
      return status;
  }
}

function TeamStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "AVAILABLE":
      return (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
          Sẵn sàng (AVAILABLE)
        </span>
      );
    case "ON_MISSION":
      return (
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 border border-orange-300 animate-pulse">
          Đang làm nhiệm vụ (ON_MISSION)
        </span>
      );
    case "OFFLINE":
      return (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-300">
          Ngoại tuyến (OFFLINE)
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {status}
        </span>
      );
  }
}

