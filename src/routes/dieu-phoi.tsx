import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { StatCard } from "@/components/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { RescueMap } from "@/components/map/RescueMap";
import { MissionTimeline } from "@/components/mission/MissionTimeline";

import { getLocationFreshness } from "@/lib/location/location-freshness";
import { calculateHaversineDistance, formatDistanceLabel } from "@/lib/location/distance";
import { rankCandidateTeams, type RankedCandidateTeam } from "@/lib/dispatch/team-ranking";

export const Route = createFileRoute("/dieu-phoi")({
  head: () => ({
    meta: [
      { title: "Trung tâm điều phối cứu hộ — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Bảng điều khiển điều phối cứu hộ khẩn cấp: Theo dõi, xác minh, đánh giá ưu tiên và phân công đội cứu hộ theo thời gian thực.",
      },
      { property: "og:title", content: "Trung tâm điều phối cứu hộ — Cứu Hộ Lũ" },
    ],
  }),
  component: CoordinatorDashboard,
});

interface RescueRequest {
  id: string;
  requesterId: string;
  locationAddress: string;
  latitude: number | string | null;
  longitude: number | string | null;
  peopleCount: number;
  description: string | null;
  priority: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RescueTeam {
  id: string;
  name: string;
  status: string;
  capacity: number;
  capability: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TeamLocation {
  teamId: string;
  teamName: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  updatedAt?: string;
  status: string;
}

interface Assignment {
  id: string;
  rescueRequestId: string;
  rescueTeamId: string;
  status: string;
  assignedAt: string;
  rescueRequest?: RescueRequest;
  rescueTeam?: RescueTeam;
}

const lifecycleStages = [
  "CREATED",
  "VERIFIED",
  "PRIORITIZED",
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
];

function getStageIndex(status: string): number {
  switch (status) {
    case "CREATED":
    case "VERIFYING":
      return 0;
    case "VERIFIED":
      return 1;
    case "PRIORITIZED":
    case "WAITING_FOR_TEAM":
      return 2;
    case "ASSIGNED":
      return 3;
    case "ACCEPTED":
      return 4;
    case "IN_PROGRESS":
      return 5;
    case "COMPLETED":
      return 6;
    default:
      return 0;
  }
}

function CoordinatorDashboard() {
  const { getAuthHeaders, session, login, logout } = useAuth();

  // Data States
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [availableTeams, setAvailableTeams] = useState<RescueTeam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teamLocations, setTeamLocations] = useState<TeamLocation[]>([]);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showTeamsOnMap, setShowTeamsOnMap] = useState<boolean>(true);
  const [showRequestsOnMap, setShowRequestsOnMap] = useState<boolean>(true);

  // Selection & UI States
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(null);
  const [selectedTeamForAssign, setSelectedTeamForAssign] = useState<string>("");

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto ensure Auth Headers (auto-authenticate as demo coordinator if session lost)
  const ensureAuthHeader = useCallback(async (): Promise<Record<string, string>> => {
    let headers = getAuthHeaders();
    if (!headers["Authorization"]) {
      try {
        await login("coordinator@flood.org", "Password123!");
        const token = localStorage.getItem("flood_rescue_access_token");
        if (token) {
          headers = { Authorization: `Bearer ${token}` };
        }
      } catch (err) {
        console.warn("Auto-authentication failed:", err);
      }
    }
    return headers;
  }, [getAuthHeaders, login]);

  // Confirmation Modals
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Fetch Team Active Locations (COORDINATOR Protected)
  const fetchTeamLocations = useCallback(async () => {
    try {
      const headers = await ensureAuthHeader();
      const res = await fetch("http://localhost:3000/rescue-teams/locations", {
        headers: { ...headers },
      });
      if (res.ok) {
        const data = await res.json();
        setTeamLocations(data);
      }
    } catch (err) {
      console.error("Lỗi tải vị trí đội cứu hộ:", err);
    }
  }, [ensureAuthHeader]);

  // Fetch All Rescue Requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);

      const url = `http://localhost:3000/rescue-requests?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Không thể tải danh sách yêu cầu cứu hộ.");
      const data = await res.json();
      setRequests(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể kết nối đến máy chủ API.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  // Fetch Available Rescue Teams
  const fetchAvailableTeams = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/rescue-teams/available");
      if (res.ok) {
        const data = await res.json();
        setAvailableTeams(data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đội cứu hộ:", err);
    }
  }, []);

  // Fetch Active Assignments
  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/assignments");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách phân công:", err);
    }
  }, []);

  // Fetch Operational Analytics Overview
  const [analytics, setAnalytics] = useState<{
    requests: { total: number; pending: number; verified: number; prioritized: number; assigned: number; completed: number; failed: number };
    priority: { critical: number; high: number; medium: number; low: number };
    teams: { total: number; available: number; onMission: number; offline: number };
    missions: { total: number; active: number; completed: number; failed: number };
    performance: { averageAssignmentTimeMinutes: number | null; averageMissionDurationMinutes: number | null };
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const headers = await ensureAuthHeader();
      const res = await fetch("http://localhost:3000/analytics/overview", { headers });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
        const now = new Date();
        const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastUpdated(timeStr);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin tổng quan vận hành:", err);
    }
  }, [ensureAuthHeader]);

  const handleExportRescueRequestsCsv = async () => {
    setExportingCsv(true);
    try {
      const headers = await ensureAuthHeader();
      const res = await fetch("http://localhost:3000/analytics/export/rescue-requests", { headers });
      if (!res.ok) throw new Error("Không thể tải báo cáo CSV.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao_cao_cuu_ho_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Lỗi xuất CSV:", err);
      alert("Không thể xuất báo cáo CSV. Vui lòng kiểm tra quyền hạn.");
    } finally {
      setExportingCsv(false);
    }
  };

  const refreshAll = useCallback(() => {
    fetchRequests();
    fetchAvailableTeams();
    fetchAssignments();
    fetchTeamLocations();
    fetchAnalytics();
  }, [fetchRequests, fetchAvailableTeams, fetchAssignments, fetchTeamLocations, fetchAnalytics]);

  // Initial Load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Keep selected request up to date when list updates
  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find((r) => r.id === selectedRequest.id);
      if (updated) setSelectedRequest(updated);
    }
  }, [requests, selectedRequest]);

  // Derived Statistics (From Real API Data)
  const totalCount = requests.length;
  const criticalCount = requests.filter((r) => r.priority === "CRITICAL").length;
  const unverifiedCount = requests.filter((r) => r.status === "CREATED").length;
  const pendingAssignCount = requests.filter(
    (r) => r.status === "PRIORITIZED" || r.status === "WAITING_FOR_TEAM"
  ).length;
  const inProgressCount = requests.filter((r) => r.status === "IN_PROGRESS").length;

  // Selected Candidate Team for Map Highlighting & Polyline Connection
  const [selectedCandidateTeamId, setSelectedCandidateTeamId] = useState<string | null>(null);

  // Dispatch Intelligence: Rank candidate teams for selected request
  const rankedCandidates = useMemo(() => {
    if (!selectedRequest) return [];
    const allTeamsCombined = availableTeams.map((team) => {
      const loc = teamLocations.find((l) => l.teamId === team.id);
      return {
        ...team,
        latitude: loc ? loc.latitude : undefined,
        longitude: loc ? loc.longitude : undefined,
        accuracy: loc ? loc.accuracy : undefined,
        locationUpdatedAt: loc ? loc.updatedAt : undefined,
      };
    });
    return rankCandidateTeams(allTeamsCombined, selectedRequest);
  }, [selectedRequest, availableTeams, teamLocations]);

  // Selected candidate map polyline calculation
  const selectedCandidate = useMemo(() => {
    return rankedCandidates.find((c) => c.team.id === selectedCandidateTeamId);
  }, [rankedCandidates, selectedCandidateTeamId]);

  const mapPolyline = useMemo(() => {
    if (
      selectedRequest?.latitude &&
      selectedRequest?.longitude &&
      selectedCandidate?.team?.latitude &&
      selectedCandidate?.team?.longitude
    ) {
      return {
        from: [Number(selectedCandidate.team.latitude), Number(selectedCandidate.team.longitude)] as [number, number],
        to: [Number(selectedRequest.latitude), Number(selectedRequest.longitude)] as [number, number],
        label: selectedCandidate.distance?.formattedKm || "Đường chim bay",
      };
    }
    return null;
  }, [selectedRequest, selectedCandidate]);

  // Filtered Requests Search
  const filteredRequests = requests.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(term) ||
      r.locationAddress.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term))
    );
  });

  // Action Handlers
  const handleVerify = (id: string, decision: "VERIFY" | "INVALID") => {
    const isInvalid = decision === "INVALID";
    setConfirmDialog({
      open: true,
      title: isInvalid ? "Đánh dấu không hợp lệ" : "Xác minh yêu cầu",
      message: isInvalid
        ? "Bạn có chắc chắn muốn đánh dấu yêu cầu này là KHÔNG HỢP LỆ?"
        : "Xác nhận thông tin yêu cầu cứu hộ này là CHÍNH XÁC?",
      onConfirm: async () => {
        setActionLoading(true);
        setActionFeedback(null);
        try {
          const authHeaders = await ensureAuthHeader();
          const res = await fetch(`http://localhost:3000/rescue-requests/${id}/verify`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({ decision }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || "Xác minh không thành công.");
          }

          setActionFeedback({
            type: "success",
            message: `Đã ${isInvalid ? "đánh dấu không hợp lệ" : "xác minh"} thành công.`,
          });
          await fetchRequests();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
          setActionFeedback({ type: "error", message: msg });
        } finally {
          setActionLoading(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handlePrioritize = async (id: string, priority: string) => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const authHeaders = await ensureAuthHeader();
      const res = await fetch(`http://localhost:3000/rescue-requests/${id}/prioritize`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ priority }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Phân mức ưu tiên không thành công.");
      }

      setActionFeedback({
        type: "success",
        message: `Đã gán mức ưu tiên ${priority} thành công.`,
      });
      await fetchRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTeam = (requestId: string, teamId: string) => {
    if (!teamId) return;
    const candidate = rankedCandidates.find((c) => c.team.id === teamId);
    const teamName = candidate?.team.name || availableTeams.find((t) => t.id === teamId)?.name || teamId;
    const distanceText = candidate?.distance ? candidate.distance.formattedKm : "Không đủ dữ liệu GPS";
    const freshnessText = candidate?.freshness ? candidate.freshness.label : "Vị trí không xác định";

    setConfirmDialog({
      open: true,
      title: "🚀 Xác nhận phân công đội cứu hộ",
      message: `Xác nhận phân công đội: "${teamName}" cho ca cứu hộ #${requestId.slice(0, 8)}...\n\n• Khoảng cách đường chim bay: ${distanceText}\n• Cập nhật GPS: ${freshnessText}\n• Trạng thái đội: ${candidate?.team.status || "AVAILABLE"}`,
      onConfirm: async () => {
        setActionLoading(true);
        setActionFeedback(null);
        try {
          // Protect against stale data: revalidate available teams
          const teamCheckRes = await fetch("http://localhost:3000/rescue-teams/available");
          if (teamCheckRes.ok) {
            const currentAvailable: RescueTeam[] = await teamCheckRes.json();
            const stillAvailable = currentAvailable.some((t) => t.id === teamId);
            if (!stillAvailable) {
              throw new Error("Đội cứu hộ này không còn sẵn sàng. Vui lòng chọn đội khác.");
            }
          }

          const authHeaders = await ensureAuthHeader();
          const res = await fetch("http://localhost:3000/assignments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              rescueRequestId: requestId,
              rescueTeamId: teamId,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (res.status === 409) {
              await refreshAll();
              throw new Error("⚠️ Yêu cầu hoặc Đội cứu hộ vừa được phân công cho nhiệm vụ khác.");
            }
            throw new Error(err.message || "Phân công thất bại.");
          }

          setActionFeedback({
            type: "success",
            message: `Đã tạo phân công nhiệm vụ cho "${teamName}" thành công!`,
          });
          setSelectedTeamForAssign("");
          await fetchRequests();
          await fetchAvailableTeams();
          await fetchAssignments();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi phân công.";
          setActionFeedback({ type: "error", message: msg });
        } finally {
          setActionLoading(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          PART 1 — PAGE HEADER & OPERATIONAL INTELLIGENCE CONTROLS
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <span>TRUNG TÂM CHỈ HUY</span>
            <span>•</span>
            <span className="text-emerald-700">ĐÀ NẴNG & MIỀN TRUNG</span>
            <span>•</span>
            <span className="text-slate-500 font-medium normal-case bg-slate-100 px-2 py-0.5 rounded">🔒 WORKSPACE NỘI BỘ (COORDINATOR)</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Trung tâm điều phối cứu hộ
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi, xác minh, đánh giá độ ưu tiên và phân công các đội cứu hộ khẩn cấp.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-1.5">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Dữ liệu cập nhật lần cuối: {lastUpdated || "--:--"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              ↻ Làm mới
            </button>
            <button
              onClick={handleExportRescueRequestsCsv}
              disabled={exportingCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-xs disabled:opacity-50"
            >
              📥 {exportingCsv ? "Đang xuất CSV..." : "Xuất báo cáo CSV"}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PART 2 — 📊 TỔNG QUAN VẬN HÀNH (Operational Intelligence KPIs)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">📊 TỔNG QUAN VẬN HÀNH</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-xs">
            <div className="text-xs font-bold text-red-700 uppercase tracking-wider">🚨 YÊU CẦU KHẨN CẤP</div>
            <div className="mt-2 text-3xl font-extrabold text-red-900">
              {analytics ? analytics.priority.critical : criticalCount}
            </div>
            <div className="mt-1 text-xs text-red-600 font-medium font-mono">CRITICAL</div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">📋 ĐANG CHỜ XỬ LÝ</div>
            <div className="mt-2 text-3xl font-extrabold text-amber-900">
              {analytics ? analytics.requests.pending : unverifiedCount + pendingAssignCount}
            </div>
            <div className="mt-1 text-xs text-amber-600 font-medium">Chờ xác minh / Chờ đội</div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">🚤 ĐỘI SẴN SÀNG</div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-900">
              {analytics ? `${analytics.teams.available} / ${analytics.teams.total}` : `${availableTeams.length}`}
            </div>
            <div className="mt-1 text-xs text-emerald-600 font-medium">Đội sẵn sàng cứu hộ</div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">🎯 ĐANG CỨU HỘ</div>
            <div className="mt-2 text-3xl font-extrabold text-blue-900">
              {analytics ? analytics.missions.active : inProgressCount}
            </div>
            <div className="mt-1 text-xs text-blue-600 font-medium">Nhiệm vụ đang diễn ra</div>
          </div>
        </div>
      </div>

      {/* Action feedback message */}
      {actionFeedback && (
        <div
          className={`rounded-xl border p-4 text-sm font-semibold ${
            actionFeedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {actionFeedback.type === "success" ? "✅" : "⚠️"} {actionFeedback.message}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PART 2.5 — REAL-TIME COORDINATOR DISASTER MAP
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🗺️ BẢN ĐỒ ĐIỀU PHỐI CỨU HỘ THỜI GIAN THỰC</span>
              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                {filteredRequests.filter((r) => r.latitude && r.longitude).length} Ca cứu hộ · {teamLocations.length} Đội GPS live
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trực quan hóa vị trí cứu hộ & đội cứu hộ thực tế trên bản đồ. Nhấp vào marker để xem thông tin chi tiết & trạng thái vị trí.
            </p>
          </div>

          {/* Map Layer Controls & Priority Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={showRequestsOnMap}
                  onChange={(e) => setShowRequestsOnMap(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>📍 Ca cứu hộ</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={showTeamsOnMap}
                  onChange={(e) => setShowTeamsOnMap(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span>🚤 Đội cứu hộ (GPS)</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700">Ưu tiên:</span>
              <span className="flex items-center gap-1 font-semibold text-red-600">
                <span className="size-2.5 rounded-full bg-red-600 inline-block" /> 🔴 Khẩn cấp
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <span className="size-2.5 rounded-full bg-amber-500 inline-block" /> 🟧 Cao
              </span>
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <span className="size-2.5 rounded-full bg-blue-600 inline-block" /> 🟦 Trung bình
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="size-2.5 rounded-full bg-emerald-600 inline-block" /> 🚤 Đội GPS
              </span>
            </div>
          </div>
        </div>

        <RescueMap
          autoFitBounds
          center={
            selectedRequest?.latitude && selectedRequest?.longitude
              ? [Number(selectedRequest.latitude), Number(selectedRequest.longitude)]
              : [16.047079, 108.20623]
          }
          zoom={selectedRequest ? 15 : 12}
          selectedMarkerId={selectedRequest?.id}
          onMarkerClick={(id) => {
            const req = requests.find((r) => r.id === id);
            if (req) setSelectedRequest(req);
          }}
          markers={[
            ...(showRequestsOnMap
              ? filteredRequests
                  .filter((r) => r.latitude && r.longitude)
                  .map((r) => ({
                    id: r.id,
                    latitude: Number(r.latitude),
                    longitude: Number(r.longitude),
                    type: "REQUEST" as const,
                    priority: r.priority,
                    status: r.status,
                    popupContent: `
                      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; min-width: 210px; max-width: 260px; padding: 2px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
                          <span style="font-weight: 800; color: #0f172a; font-family: monospace;">#${r.id.slice(0, 8)}</span>
                          <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background-color: ${
                            r.priority === "CRITICAL" ? "#fee2e2; color: #991b1b;" : r.priority === "HIGH" ? "#fef3c7; color: #92400e;" : "#dbeafe; color: #1e40af;"
                          }">${r.priority || "MEDIUM"}</span>
                        </div>
                        <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px; line-height: 1.3;">📍 ${r.locationAddress}</div>
                        <div style="color: #475569; margin-bottom: 2px;">👥 <b>Số người:</b> ${r.peopleCount} người</div>
                        <div style="color: #475569; margin-bottom: 6px;">📌 <b>Trạng thái:</b> ${r.status}</div>
                        ${r.description ? `<div style="font-style: italic; color: #64748b; font-size: 11px; margin-bottom: 8px; background: #f8fafc; padding: 4px 6px; border-radius: 4px;">"${r.description}"</div>` : ""}
                        <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                          <a href="https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background-color: #2563eb; color: white; text-decoration: none; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px;">
                            🗺️ Chỉ đường
                          </a>
                        </div>
                      </div>
                    `,
                  }))
              : []),
            ...(showTeamsOnMap
              ? teamLocations.map((t) => {
                  const freshness = getLocationFreshness(t.updatedAt);
                  return {
                    id: `team-${t.teamId}`,
                    latitude: t.latitude,
                    longitude: t.longitude,
                    type: "TEAM" as const,
                    title: t.teamName,
                    popupContent: `
                      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; min-width: 200px; padding: 2px;">
                        <div style="font-weight: 800; color: #059669; margin-bottom: 4px;">🚤 ${t.teamName}</div>
                        <div style="color: #334155; margin-bottom: 3px;">📌 <b>Trạng thái:</b> ${t.status}</div>
                        ${t.accuracy ? `<div style="color: #334155; margin-bottom: 3px;">🎯 <b>Độ chính xác GPS:</b> ~${t.accuracy}m</div>` : ""}
                        <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;" class="${freshness.className}">
                          ${freshness.label}
                        </div>
                      </div>
                    `,
                  };
                })
              : []),
          ]}
          polyline={mapPolyline}
          className="h-72 sm:h-96 w-full rounded-xl border border-slate-300 shadow-2xs"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT GRID: REQUEST LIST (Left) + DETAIL/ACTION PANEL (Right)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: REQUEST MANAGEMENT PANEL (8 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Danh sách yêu cầu cứu hộ
              </h2>
              <button
                type="button"
                onClick={() => {
                  fetchRequests();
                  fetchAvailableTeams();
                  fetchAssignments();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
              >
                🔄 Làm mới dữ liệu
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mã ID hoặc địa chỉ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="CREATED">Mới gửi (CREATED)</option>
                <option value="VERIFIED">Đã xác minh (VERIFIED)</option>
                <option value="PRIORITIZED">Đã xếp ưu tiên</option>
                <option value="ASSIGNED">Đã phân công</option>
                <option value="ACCEPTED">Đội đã nhận</option>
                <option value="IN_PROGRESS">Đang cứu hộ</option>
                <option value="COMPLETED">Hoàn tất cứu hộ</option>
                <option value="INVALID">Không hợp lệ</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="">Tất cả mức ưu tiên</option>
                <option value="CRITICAL">Khẩn cấp (CRITICAL)</option>
                <option value="HIGH">Ưu tiên cao (HIGH)</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Thấp</option>
              </select>
            </div>

            {/* Request List Items */}
            {loading ? (
              <div className="py-8 text-center text-sm font-semibold text-slate-500">
                ⏳ Đang tải dữ liệu từ máy chủ...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">
                ⚠️ {error}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Không tìm thấy yêu cầu cứu hộ phù hợp.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredRequests.map((req) => {
                  const isCritical = req.priority === "CRITICAL";
                  const isSelected = selectedRequest?.id === req.id;

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`cursor-pointer rounded-xl p-4 transition-all border ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-xs"
                          : isCritical
                          ? "border-l-4 border-l-red-600 border-red-200 bg-red-50/30 hover:bg-red-50/60"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            #{req.id.slice(0, 8)}...
                          </span>
                          {isCritical && (
                            <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white animate-pulse">
                              🚨 KHẨN CẤP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={req.priority} />
                          <StatusBadge status={req.status} />
                        </div>
                      </div>

                      <div className="mt-2.5 space-y-1">
                        <p className="text-sm font-bold text-slate-900 leading-snug">
                          📍 {req.locationAddress}
                        </p>
                        <p className="text-xs text-slate-600">
                          👥 <strong>{req.peopleCount} người</strong> {req.description ? `· ${req.description}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-500 pt-1">
                          🕒 Gửi lúc: {new Date(req.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REQUEST DETAIL & ACTION PANEL + ACTIVE OPERATIONS (5 Cols) */}
        <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
          {selectedRequest ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
              {/* Detail Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Chi tiết & Xử lý yêu cầu
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-bold"
                >
                  ✕ Đóng
                </button>
              </div>

              {/* Detail Fields */}
              <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p>
                  <strong>Mã ID:</strong>{" "}
                  <span className="font-mono text-slate-900 select-all">{selectedRequest.id}</span>
                </p>
                <p>📍 <strong>Địa chỉ:</strong> {selectedRequest.locationAddress}</p>
                {selectedRequest.latitude && selectedRequest.longitude && (
                  <div className="flex items-center justify-between font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1">
                    <span>📍 {selectedRequest.latitude}, {selectedRequest.longitude}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedRequest.latitude},${selectedRequest.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <span>🗺️ Mở chỉ đường</span>
                    </a>
                  </div>
                )}
                <p>👥 <strong>Số người:</strong> {selectedRequest.peopleCount} người</p>
                <p>📝 <strong>Mô tả:</strong> {selectedRequest.description || "Không có."}</p>
                <div className="pt-2 flex items-center justify-between">
                  <span>Trạng thái: <StatusBadge status={selectedRequest.status} /></span>
                  <span>Ưu tiên: <PriorityBadge priority={selectedRequest.priority} /></span>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  VÒNG ĐỜI YÊU CẦU (LIFECYCLE)
                </p>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                  {lifecycleStages.map((stage, idx) => {
                    const currentIdx = getStageIndex(selectedRequest.status);
                    const isPassed = idx < currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <span
                        key={stage}
                        className={`shrink-0 rounded-md px-2 py-1 font-bold ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : isPassed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {stage}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* ──────────── CONTEXTUAL ACTIONS BASED ON STATUS ──────────── */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  THAO TÁC ĐIỀU PHỐI (ACTION)
                </p>

                {/* 1. CREATED STATUS -> VERIFY ACTION */}
                {selectedRequest.status === "CREATED" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      Yêu cầu đang ở trạng thái <strong>CREATED</strong>. Vui lòng xác minh thông tin.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleVerify(selectedRequest.id, "VERIFY")}
                        className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✓ Xác minh (VERIFY)
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleVerify(selectedRequest.id, "INVALID")}
                        className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        ✕ Không hợp lệ (INVALID)
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. VERIFIED STATUS -> PRIORITIZE ACTION */}
                {selectedRequest.status === "VERIFIED" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      Yêu cầu đã được xác minh. Chọn mức độ ưu tiên:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handlePrioritize(selectedRequest.id, "CRITICAL")}
                        className="rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        🚨 CRITICAL (Gấp)
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handlePrioritize(selectedRequest.id, "HIGH")}
                        className="rounded-lg bg-amber-500 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        ⚠️ HIGH (Cao)
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handlePrioritize(selectedRequest.id, "MEDIUM")}
                        className="rounded-lg bg-sky-600 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                      >
                        MEDIUM (Trung bình)
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handlePrioritize(selectedRequest.id, "LOW")}
                        className="rounded-lg bg-slate-600 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        LOW (Thấp)
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. PRIORITIZED / WAITING_FOR_TEAM STATUS -> DISPATCH RECOMMENDATION PANEL */}
                {(selectedRequest.status === "PRIORITIZED" ||
                  selectedRequest.status === "WAITING_FOR_TEAM") && (
                  <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                    <div className="border-b border-blue-200 pb-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span>🚤 ĐỀ XUẤT ĐỘI CỨU HỘ</span>
                        </h4>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Advisory System
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        "Đề xuất của hệ thống — Quyết định của điều phối viên"
                      </p>
                    </div>

                    {/* Handle Edge Cases */}
                    {!selectedRequest.latitude || !selectedRequest.longitude ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-medium">
                        ⚠️ Yêu cầu này chưa có tọa độ GPS. Không thể tính khoảng cách tự động.
                      </div>
                    ) : rankedCandidates.length === 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-medium">
                        ⚠️ Hiện chưa có đội cứu hộ nào trong cơ sở dữ liệu.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {rankedCandidates.map((c) => {
                          const medal = c.rank === 1 ? "🥇" : c.rank === 2 ? "🥈" : c.rank === 3 ? "🥉" : `#${c.rank}`;
                          const isAvailable = c.team.status === "AVAILABLE";
                          const isHighlighted = selectedCandidateTeamId === c.team.id;

                          return (
                            <div
                              key={c.team.id}
                              onClick={() => setSelectedCandidateTeamId(c.team.id)}
                              className={`rounded-xl border p-3 text-xs transition-all cursor-pointer ${
                                isHighlighted
                                  ? "border-blue-600 bg-blue-100/80 ring-2 ring-blue-500 shadow-xs"
                                  : isAvailable
                                  ? "border-slate-200 bg-white hover:bg-blue-50/50"
                                  : "border-slate-200 bg-slate-100/80 opacity-75"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                  <span>{medal}</span>
                                  <span>{c.team.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <StatusBadge status={c.team.status} />
                                </div>
                              </div>

                              <div className="mt-2 space-y-1 text-slate-700">
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                  <span className="font-semibold text-blue-700">
                                    📍 {formatDistanceLabel(c.distance)}
                                  </span>
                                  <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${c.freshness.className}`}>
                                    {c.freshness.label}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-600 font-medium">
                                  💡 <em>{c.reason}</em>
                                </p>
                              </div>

                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  disabled={actionLoading || !isAvailable}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignTeam(selectedRequest.id, c.team.id);
                                  }}
                                  className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition-all shadow-xs ${
                                    isAvailable
                                      ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
                                      : "bg-slate-400 cursor-not-allowed"
                                  }`}
                                >
                                  {isAvailable ? "🚀 Giao nhiệm vụ" : "Đội bận / Offline"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* OTHER STATES */}
                {selectedRequest.status === "ASSIGNED" && (
                  <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-xs font-semibold text-indigo-900">
                    ℹ️ Đã phân công đội cứu hộ. Đang chờ đội cứu hộ xác nhận (ACCEPT / REJECT).
                  </div>
                )}
                {selectedRequest.status === "ACCEPTED" && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs font-semibold text-blue-900">
                    ℹ️ Đội cứu hộ đã chấp nhận nhiệm vụ. Chuẩn bị xuất phát.
                  </div>
                )}
                {selectedRequest.status === "IN_PROGRESS" && (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs font-semibold text-orange-900">
                    🚤 Đội cứu hộ đang thực hiện giải cứu tại hiện trường.
                  </div>
                )}
                {selectedRequest.status === "COMPLETED" && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-900">
                    🎉 Nhiệm vụ cứu hộ đã hoàn tất thành công!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 shadow-xs">
              👈 Chọn một yêu cầu từ danh sách bên trái để xem chi tiết và thực hiện thao tác điều phối.
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              PART 8 — ACTIVE OPERATIONS SUMMARY PANEL
             ───────────────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900">
              Hoạt động cứu hộ trực tiếp
            </h3>

            {assignments.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có nhiệm vụ phân công nào.</p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {assignments.map((as) => (
                  <div
                    key={as.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        🚤 {as.rescueTeam?.name || "Đội cứu hộ"}
                      </span>
                      <StatusBadge status={as.status} />
                    </div>
                    <p className="text-slate-600 truncate">
                      📍 {as.rescueRequest?.locationAddress || "Vị trí cứu hộ"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Giao lúc: {new Date(as.assignedAt).toLocaleTimeString("vi-VN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-slate-600">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
