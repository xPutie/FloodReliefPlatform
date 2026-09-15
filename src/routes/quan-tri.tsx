import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";

const API_BASE = "http://localhost:3000";

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

export interface RescueTeam {
  id: string;
  name: string;
  leaderName?: string;
  phone?: string;
  capacity?: number;
  capability?: string;
  status: "AVAILABLE" | "ON_MISSION" | "OFFLINE" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  rescueRequestId: string;
  rescueTeamId: string;
  status: "ASSIGNED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "FAILED" | string;
  assignedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  rescueRequest?: RescueRequest;
  rescueTeam?: RescueTeam;
}

export interface SystemHealth {
  status: string;
  database: string;
}

export const Route = createFileRoute("/quan-tri")({
  head: () => ({
    meta: [
      { title: "Quản trị Hệ thống — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Giám sát tổng thể nền tảng, trạng thái hệ thống, yêu cầu cứu hộ, đội cứu hộ và phân công nhiệm vụ.",
      },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  // Real Data States
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Request Monitoring
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Active Tab View
  const [activeTab, setActiveTab] = useState<"INTELLIGENCE" | "AUDIT" | "REQUESTS" | "TEAMS" | "ASSIGNMENTS" | "SYSTEM">("INTELLIGENCE");

  // Operational Intelligence & Audit Log States
  const [analyticsOverview, setAnalyticsOverview] = useState<{
    requests: { total: number; pending: number; verified: number; prioritized: number; assigned: number; completed: number; failed: number };
    priority: { critical: number; high: number; medium: number; low: number };
    teams: { total: number; available: number; onMission: number; offline: number };
    missions: { total: number; active: number; completed: number; failed: number };
    performance: { averageAssignmentTimeMinutes: number | null; averageMissionDurationMinutes: number | null };
  } | null>(null);

  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: any;
    createdAt: string;
    user?: { name: string; role: string; email?: string } | null;
  }>>([]);
  const [auditMeta, setAuditMeta] = useState<{ total: number; page: number; limit: number; totalPages: number }>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [auditPage, setAuditPage] = useState<number>(1);
  const [auditActionFilter, setAuditActionFilter] = useState<string>("");
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  const fetchAnalyticsOverview = useCallback(async () => {
    try {
      const token = localStorage.getItem("flood_rescue_access_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/analytics/overview`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsOverview(data);
      }
    } catch (err) {
      console.error("Lỗi tải Operational Intelligence:", err);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (page = 1, action = "") => {
    try {
      const token = localStorage.getItem("flood_rescue_access_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (action) params.append("action", action);

      const res = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.items);
        setAuditMeta(data.meta);
      }
    } catch (err) {
      console.error("Lỗi tải Audit Logs:", err);
    }
  }, []);

  const handleExportAuditCsv = async () => {
    try {
      const token = localStorage.getItem("flood_rescue_access_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/audit-logs/export`, { headers });
      if (!res.ok) throw new Error("Không thể tải báo cáo Audit CSV.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Lỗi xuất Audit CSV:", err);
      alert("Không thể xuất báo cáo Audit CSV.");
    }
  };

  useEffect(() => {
    fetchAnalyticsOverview();
    fetchAuditLogs(auditPage, auditActionFilter);
  }, [fetchAnalyticsOverview, fetchAuditLogs, auditPage, auditActionFilter]);

  // Selected Item for Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(null);

  // Fetch all real backend data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Health
      const resHealth = await fetch(`${API_BASE}/health`).catch(() => null);
      if (resHealth && resHealth.ok) {
        const healthData = await resHealth.json();
        setHealth(healthData);
      } else {
        setHealth({ status: "offline", database: "disconnected" });
      }

      // 2. Fetch Requests
      const resRequests = await fetch(`${API_BASE}/rescue-requests`);
      if (!resRequests.ok) throw new Error("Không thể tải dữ liệu yêu cầu cứu hộ.");
      const requestsData: RescueRequest[] = await resRequests.json();
      setRequests(requestsData);

      // 3. Fetch Teams
      const resTeams = await fetch(`${API_BASE}/rescue-teams`);
      if (!resTeams.ok) throw new Error("Không thể tải dữ liệu đội cứu hộ.");
      const teamsData: RescueTeam[] = await resTeams.json();
      setTeams(teamsData);

      // 4. Fetch Assignments
      const resAssignments = await fetch(`${API_BASE}/assignments`);
      if (!resAssignments.ok) throw new Error("Không thể tải dữ liệu phân công.");
      const assignmentsData: Assignment[] = await resAssignments.json();
      setAssignments(assignmentsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể kết nối với máy chủ backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side search & filtering for requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Status filter
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      // Priority filter
      if (priorityFilter !== "ALL" && r.priority !== priorityFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLoc = r.locationAddress?.toLowerCase().includes(q);
        const matchId = r.id?.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        if (!matchLoc && !matchId && !matchDesc) return false;
      }
      return true;
    });
  }, [requests, searchQuery, statusFilter, priorityFilter]);

  // Calculated statistics
  const stats = useMemo(() => {
    const totalRequests = requests.length;
    const activeRequests = requests.filter(
      (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED" && r.status !== "INVALID"
    ).length;
    const completedRequests = requests.filter((r) => r.status === "COMPLETED").length;
    
    const totalTeams = teams.length;
    const availableTeams = teams.filter((t) => t.status === "AVAILABLE").length;
    const onMissionTeams = teams.filter((t) => t.status === "ON_MISSION").length;

    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(
      (a) => a.status === "ASSIGNED" || a.status === "ACCEPTED"
    ).length;

    return {
      totalRequests,
      activeRequests,
      completedRequests,
      totalTeams,
      availableTeams,
      onMissionTeams,
      totalAssignments,
      activeAssignments,
    };
  }, [requests, teams, assignments]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Global API Error Banner */}
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

        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide">
                🔒 WORKSPACE NỘI BỘ — ADMIN
              </span>
              <span className="text-xs text-slate-500">
                (Auth/RBAC Backend đang chờ tích hợp)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Quản trị hệ thống
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                ● HỆ THỐNG ĐANG HOẠT ĐỘNG
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Giám sát tổng thể nền tảng, người dùng và hoạt động cứu hộ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <span className={loading ? "animate-spin" : ""}>↻</span>
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
        </div>

        {/* SYSTEM OVERVIEW STATISTICAL CARDS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard
            label="Tổng yêu cầu cứu hộ"
            value={String(stats.totalRequests)}
            hint="Dữ liệu từ hệ thống"
          />
          <StatCard
            label="Đang xử lý"
            value={String(stats.activeRequests)}
            hint="Chưa kết thúc"
          />
          <StatCard
            label="Đã hoàn thành"
            value={String(stats.completedRequests)}
            hint="Tổng số ca cứu hộ xong"
          />
          <StatCard
            label="Đội cứu hộ"
            value={String(stats.totalTeams)}
            hint={`${stats.availableTeams} sẵn sàng · ${stats.onMissionTeams} làm nhiệm vụ`}
          />
          <StatCard
            label="Phân công nhiệm vụ"
            value={String(stats.totalAssignments)}
            hint={`${stats.activeAssignments} nhiệm vụ active`}
          />
        </div>

        {/* TECHNICAL SYSTEM HEALTH & STATUS SUMMARY */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Trạng thái kỹ thuật hệ thống (Real-time Health Check)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="block text-xs text-slate-500">Backend API</span>
              <span className={`font-bold mt-0.5 inline-block ${health?.status === "ok" ? "text-emerald-700" : "text-red-700"}`}>
                {health?.status === "ok" ? "🟢 ONLINE (HTTP 200)" : "🔴 OFFLINE"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="block text-xs text-slate-500">Database MySQL</span>
              <span className={`font-bold mt-0.5 inline-block ${health?.database === "connected" ? "text-emerald-700" : "text-red-700"}`}>
                {health?.database === "connected" ? "🟢 CONNECTED (Port 3307)" : "🔴 DISCONNECTED"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="block text-xs text-slate-500">Service Yêu cầu Cứu hộ</span>
              <span className="font-bold text-emerald-700 mt-0.5 inline-block">
                🟢 READY ({stats.totalRequests} records)
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="block text-xs text-slate-500">Service Đội Cứu hộ</span>
              <span className="font-bold text-emerald-700 mt-0.5 inline-block">
                🟢 READY ({stats.totalTeams} teams)
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS FOR MONITORING PANELS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("INTELLIGENCE")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "INTELLIGENCE"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            📊 Operational Intelligence
          </button>
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "AUDIT"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            🧾 Nhật ký Vận hành
          </button>
          <button
            onClick={() => setActiveTab("REQUESTS")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "REQUESTS"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Giám sát Yêu cầu ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("TEAMS")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "TEAMS"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Giám sát Đội Cứu hộ ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab("ASSIGNMENTS")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "ASSIGNMENTS"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Phân công Nhiệm vụ ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab("SYSTEM")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "SYSTEM"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Quản lý Hệ thống
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 0A: 📊 PLATFORM OPERATIONAL INTELLIGENCE
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "INTELLIGENCE" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">📊 PLATFORM OPERATIONAL INTELLIGENCE</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thống kê thực tế từ cơ sở dữ liệu backend. Không sử dụng dữ liệu giả lập.
                  </p>
                </div>
                <button
                  onClick={fetchAnalyticsOverview}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
                >
                  ↻ Làm mới metrics
                </button>
              </div>

              {/* A. Rescue Requests Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">A. RESCUE REQUESTS (YÊU CẦU CỨU HỘ)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-500 font-medium">Tổng số</span>
                    <span className="text-xl font-bold text-slate-900">{analyticsOverview?.requests.total ?? requests.length}</span>
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                    <span className="block text-xs text-red-700 font-bold">Critical</span>
                    <span className="text-xl font-bold text-red-900">{analyticsOverview?.priority.critical ?? requests.filter(r=>r.priority==='CRITICAL').length}</span>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <span className="block text-xs text-amber-700 font-bold">High</span>
                    <span className="text-xl font-bold text-amber-900">{analyticsOverview?.priority.high ?? requests.filter(r=>r.priority==='HIGH').length}</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <span className="block text-xs text-blue-700 font-bold">Medium</span>
                    <span className="text-xl font-bold text-blue-900">{analyticsOverview?.priority.medium ?? requests.filter(r=>r.priority==='MEDIUM').length}</span>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-600 font-bold">Low</span>
                    <span className="text-xl font-bold text-slate-800">{analyticsOverview?.priority.low ?? requests.filter(r=>r.priority==='LOW').length}</span>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                    <span className="block text-xs text-orange-700 font-bold">Đang chờ</span>
                    <span className="text-xl font-bold text-orange-900">{analyticsOverview?.requests.pending ?? 0}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="block text-xs text-emerald-700 font-bold">Hoàn thành</span>
                    <span className="text-xl font-bold text-emerald-900">{analyticsOverview?.requests.completed ?? 0}</span>
                  </div>
                  <div className="bg-slate-200 p-3 rounded-xl border border-slate-300">
                    <span className="block text-xs text-slate-700 font-bold">Thất bại</span>
                    <span className="text-xl font-bold text-slate-900">{analyticsOverview?.requests.failed ?? 0}</span>
                  </div>
                </div>

                {/* Priority distribution visual bar */}
                {analyticsOverview && (
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Phân bố mức độ ưu tiên:</span>
                      <span>CRITICAL ({analyticsOverview.priority.critical}) • HIGH ({analyticsOverview.priority.high}) • MEDIUM ({analyticsOverview.priority.medium}) • LOW ({analyticsOverview.priority.low})</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${analyticsOverview.requests.total ? (analyticsOverview.priority.critical / analyticsOverview.requests.total) * 100 : 0}%` }} className="bg-red-600" />
                      <div style={{ width: `${analyticsOverview.requests.total ? (analyticsOverview.priority.high / analyticsOverview.requests.total) * 100 : 0}%` }} className="bg-amber-500" />
                      <div style={{ width: `${analyticsOverview.requests.total ? (analyticsOverview.priority.medium / analyticsOverview.requests.total) * 100 : 0}%` }} className="bg-blue-500" />
                      <div style={{ width: `${analyticsOverview.requests.total ? (analyticsOverview.priority.low / analyticsOverview.requests.total) * 100 : 0}%` }} className="bg-slate-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* B. Rescue Teams Breakdown */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">B. RESCUE TEAMS (ĐỘI CỨU HỘ)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-500 font-medium">Tổng số đội</span>
                    <span className="text-2xl font-bold text-slate-900">{analyticsOverview?.teams.total ?? teams.length}</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <span className="block text-xs text-emerald-700 font-bold">Đội sẵn sàng</span>
                    <span className="text-2xl font-bold text-emerald-900">{analyticsOverview?.teams.available ?? 0}</span>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <span className="block text-xs text-blue-700 font-bold">Đang làm nhiệm vụ</span>
                    <span className="text-2xl font-bold text-blue-900">{analyticsOverview?.teams.onMission ?? 0}</span>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-600 font-bold">Ngoại tuyến (Offline)</span>
                    <span className="text-2xl font-bold text-slate-800">{analyticsOverview?.teams.offline ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* C. Performance Metrics */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">C. PERFORMANCE METRICS (HIỆU SUẤT VẬN HÀNH THỰC TẾ)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-500 font-medium">Thời gian phân công trung bình (Time to Assignment)</span>
                    <div className="mt-1 text-2xl font-bold text-slate-900">
                      {analyticsOverview?.performance.averageAssignmentTimeMinutes !== null
                        ? `${analyticsOverview?.performance.averageAssignmentTimeMinutes} phút`
                        : "Chưa đủ dữ liệu để tính"}
                    </div>
                    <span className="text-xs text-slate-500">Tính từ lúc gửi yêu cầu ➔ tạo phân công</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-500 font-medium">Thời gian làm nhiệm vụ trung bình (Mission Duration)</span>
                    <div className="mt-1 text-2xl font-bold text-slate-900">
                      {analyticsOverview?.performance.averageMissionDurationMinutes !== null
                        ? `${analyticsOverview?.performance.averageMissionDurationMinutes} phút`
                        : "Chưa đủ dữ liệu để tính"}
                    </div>
                    <span className="text-xs text-slate-500">Tính từ lúc nhận nhiệm vụ ➔ hoàn thành</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 0B: 🧾 NHẬT KÝ VẬN HÀNH (Backend Generated Audit Log)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "AUDIT" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">🧾 NHẬT KÝ VẬN HÀNH (AUDIT LOGS)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toàn bộ hành động tác động dữ liệu được ghi nhận tự động từ backend.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAuditCsv}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-xs"
                >
                  📥 Xuất Audit CSV
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Lọc hành động:</span>
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900"
              >
                <option value="">Tất cả hành động</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                <option value="REQUEST_VERIFIED">REQUEST_VERIFIED</option>
                <option value="REQUEST_PRIORITIZED">REQUEST_PRIORITIZED</option>
                <option value="ASSIGNMENT_CREATED">ASSIGNMENT_CREATED</option>
                <option value="ASSIGNMENT_ACCEPTED">ASSIGNMENT_ACCEPTED</option>
                <option value="MISSION_STARTED">MISSION_STARTED</option>
                <option value="MISSION_COMPLETED">MISSION_COMPLETED</option>
                <option value="MISSION_FAILED">MISSION_FAILED</option>
              </select>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Người thực hiện</th>
                    <th className="p-3">Vai trò</th>
                    <th className="p-3">Hành động</th>
                    <th className="p-3">Đối tượng</th>
                    <th className="p-3">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                        Chưa có dữ liệu nhật ký vận hành.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedAuditLog(log)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-mono text-slate-500">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {log.user?.name || "System / Unauthenticated"}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {log.user?.role || "N/A"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            log.action.includes("FAILED") ? "bg-red-100 text-red-800" :
                            log.action.includes("COMPLETED") || log.action.includes("SUCCESS") ? "bg-emerald-100 text-emerald-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {log.entityType} #{log.entityId ? log.entityId.slice(0, 8) : "N/A"}
                        </td>
                        <td className="p-3 text-blue-600 underline font-medium">
                          Xem chi tiết
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Trang {auditMeta.page} / {auditMeta.totalPages} ({auditMeta.total} bản ghi)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  ◀ Trang trước
                </button>
                <button
                  disabled={auditPage >= auditMeta.totalPages}
                  onClick={() => setAuditPage((p) => Math.min(auditMeta.totalPages, p + 1))}
                  className="px-3 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Trang sau ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Detail Drawer / Modal */}
        {selectedAuditLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">🔍 Chi tiết Nhật ký Vận hành</h3>
                <button
                  onClick={() => setSelectedAuditLog(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="font-bold text-slate-500">ID Nhật ký:</span>
                  <span className="font-mono text-slate-900">{selectedAuditLog.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="font-bold text-slate-500">Thời gian:</span>
                  <span>{new Date(selectedAuditLog.createdAt).toLocaleString("vi-VN")}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="font-bold text-slate-500">Người thực hiện:</span>
                  <span className="font-semibold text-slate-900">{selectedAuditLog.user?.name || "System"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="font-bold text-slate-500">Vai trò:</span>
                  <span>{selectedAuditLog.user?.role || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="font-bold text-slate-500">Hành động:</span>
                  <span className="font-mono font-bold text-blue-700">{selectedAuditLog.action}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="font-bold text-slate-500">Đối tượng:</span>
                  <span className="font-mono">{selectedAuditLog.entityType} ({selectedAuditLog.entityId || "N/A"})</span>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="font-bold text-slate-500 block">Metadata:</span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedAuditLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedAuditLog(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: RESCUE REQUEST SYSTEM MONITORING */}
        {activeTab === "REQUESTS" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Giám sát Yêu cầu Cứu hộ</h2>
                <p className="text-xs text-slate-500">
                  Xem tất cả các yêu cầu gửi về hệ thống theo thời gian thực (chế độ giám sát).
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Hiển thị {filteredRequests.length} / {requests.length} yêu cầu
              </span>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Tìm theo vị trí, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="CREATED">Mới gửi (CREATED)</option>
                <option value="VERIFIED">Đã xác minh (VERIFIED)</option>
                <option value="PRIORITIZED">Đã phân ưu tiên (PRIORITIZED)</option>
                <option value="ASSIGNED">Đã phân công (ASSIGNED)</option>
                <option value="ACCEPTED">Đã tiếp nhận (ACCEPTED)</option>
                <option value="IN_PROGRESS">Đang cứu hộ (IN_PROGRESS)</option>
                <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="ALL">Tất cả độ ưu tiên</option>
                <option value="CRITICAL">KHẨN CẤP (CRITICAL)</option>
                <option value="HIGH">CAO (HIGH)</option>
                <option value="MEDIUM">TRUNG BÌNH (MEDIUM)</option>
                <option value="LOW">THẤP (LOW)</option>
              </select>
            </div>

            {/* REQUEST MONITORING TABLE */}
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Đang tải danh sách yêu cầu cứu hộ...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Chưa có dữ liệu phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">ID / Thời gian</th>
                      <th className="px-4 py-3">Vị trí địa lý</th>
                      <th className="px-4 py-3">Số người</th>
                      <th className="px-4 py-3">Mức ưu tiên</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRequests.map((req) => {
                      const isCritical = req.priority === "CRITICAL";

                      return (
                        <tr
                          key={req.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isCritical ? "bg-red-50/30" : ""
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              #{req.id.slice(0, 8)}
                            </code>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {new Date(req.createdAt).toLocaleString("vi-VN")}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 line-clamp-1">
                              📍 {req.locationAddress}
                            </p>
                            {req.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {req.description}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                            {req.peopleCount} người
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <PriorityBadge priority={req.priority ?? null} />
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={req.status} />
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              👁️ Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RESCUE TEAM SYSTEM MONITORING */}
        {activeTab === "TEAMS" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Giám sát Đội Cứu hộ</h2>
                <p className="text-xs text-slate-500">
                  Danh sách và năng lực vận hành của các đội cứu hộ trong hệ thống.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Tổng số: {teams.length} đội cứu hộ
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Đang tải danh sách đội cứu hộ...
              </div>
            ) : teams.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Chưa có dữ liệu đội cứu hộ.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{team.name}</h3>
                        <code className="text-[11px] font-mono text-slate-500">ID: #{team.id.slice(0, 8)}</code>
                      </div>
                      <TeamStatusBadge status={team.status} />
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sức chứa cứu hộ:</span>
                        <span className="font-semibold text-slate-800">
                          {team.capacity ? `${team.capacity} người` : "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Năng lực / Phương tiện:</span>
                        <span className="font-semibold text-slate-800">
                          {team.capability || "Cứu hộ chung"}
                        </span>
                      </div>
                      {team.leaderName && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Đội trưởng:</span>
                          <span className="font-semibold text-slate-800">
                            {team.leaderName} {team.phone ? `(${team.phone})` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS MONITORING */}
        {activeTab === "ASSIGNMENTS" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Phân công & Hoạt động Cứu hộ</h2>
                <p className="text-xs text-slate-500">
                  Lịch sử phân công và trạng thái thực thi nhiệm vụ của các đội cứu hộ.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Tổng số: {assignments.length} nhiệm vụ
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Đang tải lịch sử phân công...
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Chưa có dữ liệu phân công nhiệm vụ.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">ID Phân công</th>
                      <th className="px-4 py-3">Yêu cầu Cứu hộ</th>
                      <th className="px-4 py-3">Đội được phân công</th>
                      <th className="px-4 py-3">Trạng thái Nhiệm vụ</th>
                      <th className="px-4 py-3">Thời gian tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {assignments.map((asgn) => (
                      <tr key={asgn.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                            #{asgn.id.slice(0, 8)}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 line-clamp-1">
                            📍 {asgn.rescueRequest?.locationAddress || asgn.rescueRequestId}
                          </p>
                          {asgn.rescueRequest?.priority && (
                            <div className="mt-0.5">
                              <PriorityBadge priority={asgn.rescueRequest.priority} />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          🚤 {asgn.rescueTeam?.name || asgn.rescueTeamId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={asgn.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(asgn.createdAt).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USER MANAGEMENT & INTEGRATION-READY SYSTEM MODULES */}
        {activeTab === "SYSTEM" && (
          <div className="space-y-6">
            {/* USER MANAGEMENT SECTION - INTEGRATION READY EMPTY STATE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Quản lý Người dùng</h2>
                <p className="text-xs text-slate-500">
                  Quản lý tài khoản, danh sách người dân, điều phối viên và đội cứu hộ.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 text-sm text-blue-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-base text-blue-900">
                  <span>👤</span>
                  <span>Chưa có API quản trị người dùng</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Module quản trị tài khoản, phân quyền RBAC và quản lý danh sách người dùng sẽ được tự động hiển thị tại đây khi backend hoàn tất phát triển các API User Management.
                </p>
              </div>
            </div>

            {/* TECHNICAL SYSTEM INFRASTRUCTURE STATUS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Cấu hình & Tích hợp Kỹ thuật</h2>
                <p className="text-xs text-slate-500">Trạng thái các module mở rộng của hệ thống.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-500">Module Xác thực (Authentication / AuthN)</span>
                  <p className="text-sm font-bold text-slate-800">Chế độ Demo (Không yêu cầu đăng nhập)</p>
                  <p className="text-xs text-slate-500">Sẵn sàng tích hợp JWT / OAuth2</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-500">Module Phân quyền (RBAC)</span>
                  <p className="text-sm font-bold text-slate-800">Phân định vai trò trên UI Route</p>
                  <p className="text-xs text-slate-500">Sẵn sàng tích hợp Middleware Guard</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-500">Module Bản đồ Geo (GIS Mapping)</span>
                  <p className="text-sm font-bold text-slate-800">Ghi nhận tọa độ Latitude / Longitude</p>
                  <p className="text-xs text-slate-500">Sẵn sàng tích hợp Mapbox / Leaflet</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-500">Module Kho Cứu trợ (Relief Inventory)</span>
                  <p className="text-sm font-bold text-slate-800">Giao diện Cứu trợ Sẵn sàng</p>
                  <p className="text-xs text-slate-500">Chờ kết nối REST API Kho hàng</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* INSPECTION DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Giám sát Yêu cầu #{selectedRequest.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-500">Thông tin chi tiết yêu cầu cứu hộ</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="block text-xs text-slate-500">Mức độ ưu tiên</span>
                <div className="mt-1"><PriorityBadge priority={selectedRequest.priority ?? null} /></div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="block text-xs text-slate-500">Trạng thái xử lý</span>
                <div className="mt-1"><StatusBadge status={selectedRequest.status} /></div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 sm:col-span-2">
                <span className="block text-xs text-slate-500">Địa chỉ / Khu vực</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.locationAddress}</p>
                {(selectedRequest.latitude || selectedRequest.longitude) && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tọa độ: {selectedRequest.latitude}, {selectedRequest.longitude}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="block text-xs text-slate-500">Số lượng người</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.peopleCount} người</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="block text-xs text-slate-500">Thời gian khởi tạo</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {new Date(selectedRequest.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            {selectedRequest.description && (
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-sm">
                <span className="block text-xs text-slate-500 mb-1">Mô tả tình hình</span>
                <p className="text-slate-800 leading-relaxed">{selectedRequest.description}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// --- HELPER COMPONENTS ---

function TeamStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "AVAILABLE":
      return (
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
          Sẵn sàng (AVAILABLE)
        </span>
      );
    case "ON_MISSION":
      return (
        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800 border border-orange-300 animate-pulse">
          Đang làm nhiệm vụ
        </span>
      );
    case "OFFLINE":
      return (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 border border-slate-300">
          Ngoại tuyến (OFFLINE)
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {status}
        </span>
      );
  }
}

