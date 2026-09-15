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

export const Route = createFileRoute("/cuu-tro")({
  head: () => ({
    meta: [
      { title: "Quản lý Cứu trợ — Cứu Hộ Lũ" },
      {
        name: "description",
        content:
          "Theo dõi nhu cầu hỗ trợ người dân và sẵn sàng tích hợp nguồn lực cứu trợ.",
      },
    ],
  }),
  component: ReliefManagementPage,
});

function ReliefManagementPage() {
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Selected Detail Request
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(null);

  // Fetch real data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/rescue-requests`;
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Không thể tải danh sách nhu cầu cứu trợ.");
      const data: RescueRequest[] = await res.json();
      setRequests(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side search filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchAddress = r.locationAddress?.toLowerCase().includes(query);
      const matchId = r.id?.toLowerCase().includes(query);
      const matchDesc = r.description?.toLowerCase().includes(query);
      return matchAddress || matchId || matchDesc;
    });
  }, [requests, searchQuery]);

  // Dynamic statistics calculated from real request data
  const stats = useMemo(() => {
    const total = requests.length;
    const activeNeeds = requests.filter(
      (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED" && r.status !== "INVALID"
    ).length;
    const critical = requests.filter((r) => r.priority === "CRITICAL").length;
    const completed = requests.filter((r) => r.status === "COMPLETED").length;

    return { total, activeNeeds, critical, completed };
  }, [requests]);

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Cứu trợ
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                ● HỆ THỐNG ĐANG HOẠT ĐỘNG
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Theo dõi nhu cầu hỗ trợ và tình trạng nguồn lực tại các khu vực bị ảnh hưởng.
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

        {/* OVERVIEW STATISTICS CARDS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard
            label="Tổng nhu cầu hỗ trợ"
            value={String(stats.total)}
            hint="Ghi nhận từ hệ thống"
          />
          <StatCard
            label="Đang cần hỗ trợ"
            value={String(stats.activeNeeds)}
            hint="Chưa hoàn thành"
          />
          <StatCard
            label="Khẩn cấp"
            value={String(stats.critical)}
            hint="Mức độ ưu tiên cao nhất"
          />
          <StatCard
            label="Đã hoàn thành"
            value={String(stats.completed)}
            hint="Ca hỗ trợ đã kết thúc"
          />
          <StatCard
            label="Nguồn lực"
            value="Đang cập nhật"
            hint="Chờ tích hợp Module Kho"
          />
        </div>

        {/* MAIN CONTENT GRID: 2 COLUMNS ON DESKTOP */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* LEFT 2 COLUMNS: AFFECTED AREAS & SUPPORT NEEDS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Khu vực cần hỗ trợ</h2>
                  <p className="text-xs text-slate-500">
                    Thông tin nhu cầu được tổng hợp từ các yêu cầu cứu hộ đã ghi nhận.
                  </p>
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  Hiển thị {filteredRequests.length} nhu cầu
                </span>
              </div>

              {/* SEARCH & FILTERS BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Tìm theo khu vực, nội dung..."
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

              {/* REQUESTS LIST */}
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Đang tải thông tin nhu cầu cứu trợ...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  Chưa có dữ liệu cứu trợ phù hợp với bộ lọc.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((req) => {
                    const isCritical = req.priority === "CRITICAL";

                    return (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
                          isCritical
                            ? "border-l-4 border-l-red-600 border-red-200 bg-red-50/40"
                            : "border-slate-200 bg-white hover:border-blue-300"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <code className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                #{req.id.slice(0, 8)}
                              </code>
                              <PriorityBadge priority={req.priority ?? null} />
                              <StatusBadge status={req.status} />
                            </div>

                            <p className="text-base font-bold text-slate-900 truncate">
                              📍 {req.locationAddress || "Chưa rõ vị trí"}
                            </p>

                            {req.description && (
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {req.description}
                              </p>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 text-xs text-slate-500 shrink-0">
                            <span className="font-bold text-slate-800">
                              👥 {req.peopleCount} người cần hỗ trợ
                            </span>
                            <span>
                              {new Date(req.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 1 COLUMN: RESOURCE & WAREHOUSE INTEGRATION SECTION */}
          <div className="space-y-4">
            
            {/* RELIEF OVERVIEW PANEL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Cứu trợ khẩn cấp</h2>
              <p className="text-xs text-slate-600">
                Tổng quan hỗ trợ nhu yếu phẩm và lực lượng tiếp tế khu vực bị cô lập.
              </p>

              <div className="space-y-3 pt-2">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="block text-xs font-semibold text-slate-500">Nhu cầu chính</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    Lương thực, nước uống, vật tư y tế khẩn cấp
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="block text-xs font-semibold text-slate-500">Đối tượng ưu tiên</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    Trẻ em, người già và người bị thương tại vùng lũ
                  </p>
                </div>
              </div>
            </div>

            {/* RESOURCE & WAREHOUSE INTEGRATION-READY STATE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Nguồn lực & Kho cứu trợ</h2>
                <p className="text-xs text-slate-500">
                  Theo dõi vật tư nhu yếu phẩm chuẩn bị phân phối.
                </p>
              </div>

              {/* Resource Categories Placeholder (Integration Ready) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center">
                  <span className="text-xl">🚰</span>
                  <p className="mt-1 text-xs font-bold text-slate-800">Nước uống</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Chờ kết nối kho</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center">
                  <span className="text-xl">🍞</span>
                  <p className="mt-1 text-xs font-bold text-slate-800">Lương thực</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Chờ kết nối kho</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center">
                  <span className="text-xl">🩺</span>
                  <p className="mt-1 text-xs font-bold text-slate-800">Vật tư y tế</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Chờ kết nối kho</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center">
                  <span className="text-xl">🧥</span>
                  <p className="mt-1 text-xs font-bold text-slate-800">Chăn màn / Áo ấm</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Chờ kết nối kho</p>
                </div>
              </div>

              {/* Honest Integration Notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>📦</span>
                  <span>Chưa có dữ liệu nguồn lực</span>
                </p>
                <p className="text-blue-800 leading-relaxed">
                  Thông tin kho, vật tư và phân phối cứu trợ sẽ được hiển thị tại đây khi module quản lý nguồn lực được tích hợp vào hệ thống.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SUPPORT NEED DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Chi tiết nhu cầu hỗ trợ #{selectedRequest.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-500">Thông tin chi tiết từ hệ thống cứu hộ</p>
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
                <span className="block text-xs text-slate-500 mb-1">Mô tả nhu cầu & hoàn cảnh</span>
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

