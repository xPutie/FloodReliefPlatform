import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SmsFallback } from "@/components/SmsFallback";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { getCurrentBrowserLocation, getAccuracyRating } from "@/lib/location/geolocation";
import { reverseGeocode, forwardGeocode } from "@/lib/location/geocoding";
import { RescueMap } from "@/components/map/RescueMap";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cứu Hộ Lũ — Hỗ trợ & Theo dõi cứu hộ khẩn cấp" },
      {
        name: "description",
        content:
          "Nền tảng kết nối người dân, trung tâm điều phối và các đội cứu hộ. Tra cứu trạng thái yêu cầu cứu hộ thời gian thực theo mã Request ID.",
      },
      { property: "og:title", content: "Cứu Hộ Lũ — Hỗ trợ & Theo dõi cứu hộ khẩn cấp" },
      {
        property: "og:description",
        content: "Tiếp nhận yêu cầu cứu hộ, tra cứu và theo dõi tiến trình cứu hộ khẩn cấp.",
      },
    ],
  }),
  component: CitizenHomePage,
});

// Interface for RescueRequest from backend API GET /rescue-requests/:id
interface RescueRequestData {
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

const processSteps = [
  {
    num: "01",
    title: "Gửi yêu cầu",
    desc: "Người dân cung cấp vị trí, số người và thông tin tình trạng khẩn cấp.",
  },
  {
    num: "02",
    title: "Điều phối xác minh",
    desc: "Trung tâm chỉ huy tiếp nhận, xác minh thông tin và đánh giá mức ưu tiên.",
  },
  {
    num: "03",
    title: "Phân công đội cứu hộ",
    desc: "Hệ thống kết nối và phân công đội cứu hộ phù hợp ở vị trí gần nhất.",
  },
  {
    num: "04",
    title: "Hoàn tất cứu hộ",
    desc: "Đội cứu hộ tiếp cận hiện trường, thực hiện giải cứu và đưa về nơi an toàn.",
  },
];

// Main lifecycle stage ordering for visual status timeline
const timelineStages = [
  { key: "CREATED", label: "Mới gửi (CREATED)", stepNum: 1 },
  { key: "VERIFIED", label: "Đã xác minh (VERIFIED)", stepNum: 2 },
  { key: "PRIORITIZED", label: "Đã phân mức ưu tiên (PRIORITIZED)", stepNum: 3 },
  { key: "ASSIGNED", label: "Đã phân công đội (ASSIGNED)", stepNum: 4 },
  { key: "ACCEPTED", label: "Đội chấp nhận (ACCEPTED)", stepNum: 5 },
  { key: "IN_PROGRESS", label: "Đang cứu hộ (IN_PROGRESS)", stepNum: 6 },
  { key: "COMPLETED", label: "Hoàn tất cứu hộ (COMPLETED)", stepNum: 7 },
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

function CitizenHomePage() {
  // Form Inputs State
  const [address, setAddress] = useState("Phường Hòa Cường Nam, Quận Hải Châu, Đà Nẵng");
  const [latitude, setLatitude] = useState<string>("16.0354");
  const [longitude, setLongitude] = useState<string>("108.2207");

  // GPS & Map Picker State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | undefined>(undefined);
  const [isGPSDetected, setIsGPSDetected] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  const [isAutoGeocoded, setIsAutoGeocoded] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  // Address Search -> Locate on Map State
  const [searchGeocodeLoading, setSearchGeocodeLoading] = useState(false);
  const [addressLocatedStatus, setAddressLocatedStatus] = useState<string | null>(null);

  // Handle Forward Geocoding: Text Address -> Map Position
  const handleLocateAddressOnMap = async (addressQuery?: string) => {
    const q = addressQuery || address;
    if (!q.trim()) return;

    setSearchGeocodeLoading(true);
    setAddressLocatedStatus(null);

    try {
      const res = await forwardGeocode(q);
      if (res) {
        setLatitude(String(res.latitude));
        setLongitude(String(res.longitude));
        setShowMapPicker(true);
        setIsGPSDetected(false);
        setGpsAccuracy(undefined);
        setLocationConfirmed(true);
        setAddressLocatedStatus(`🎯 Bản đồ đã di chuyển đến: ${res.displayName}`);
      } else {
        setAddressLocatedStatus("⚠️ Không tìm thấy vị trí tự động cho địa chỉ này. Bạn có thể chọn vị trí thủ công trên bản đồ.");
      }
    } catch (err) {
      console.warn("Locate address error:", err);
    } finally {
      setSearchGeocodeLoading(false);
    }
  };

  // Handle GPS 1-Click Detection
  const handleDetectGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    setLocationConfirmed(false); // Reset confirmation on new detection
    try {
      const coords = await getCurrentBrowserLocation();
      setLatitude(String(coords.latitude));
      setLongitude(String(coords.longitude));
      setGpsAccuracy(coords.accuracy);
      setIsGPSDetected(true);

      // Perform Reverse Geocoding
      setGeocodingLoading(true);
      const geoResult = await reverseGeocode(coords.latitude, coords.longitude);
      if (geoResult?.formattedAddress) {
        setAddress(geoResult.formattedAddress);
        setIsAutoGeocoded(true);
      }
    } catch (err: any) {
      setGpsError(err.message || "Không thể lấy vị trí GPS tự động. Bạn có thể chọn vị trí trực tiếp trên bản đồ.");
    } finally {
      setGpsLoading(false);
      setGeocodingLoading(false);
    }
  };

  // Handle Manual Map Position Selection
  const handleMapPositionChange = async (lat: number, lng: number) => {
    setLatitude(String(lat));
    setLongitude(String(lng));
    setIsGPSDetected(false); // Manual pick replaces GPS accuracy circle
    setGpsAccuracy(undefined);
    setLocationConfirmed(false); // Reset confirmation when marker is moved

    setGeocodingLoading(true);
    const geoResult = await reverseGeocode(lat, lng);
    if (geoResult?.formattedAddress) {
      setAddress(geoResult.formattedAddress);
      setIsAutoGeocoded(true);
    }
    setGeocodingLoading(false);
  };
  const [peopleCount, setPeopleCount] = useState<number>(3);
  const [vulnerableGroups, setVulnerableGroups] = useState<string[]>(["children"]);
  const [description, setDescription] = useState("");
  const [showSms, setShowSms] = useState(false);

  // Submission State
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Tracking Search State
  const [searchId, setSearchId] = useState<string>("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedRequest, setTrackedRequest] = useState<RescueRequestData | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const toggleVulnerableGroup = (key: string) => {
    setVulnerableGroups((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Submit Handler -> Calls NestJS API POST /rescue-requests
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const payload: {
        locationAddress: string;
        peopleCount: number;
        latitude?: number;
        longitude?: number;
        description?: string;
      } = {
        locationAddress: address.trim() || "Vị trí không xác định",
        peopleCount: Number(peopleCount) || 1,
      };

      if (latitude && !isNaN(Number(latitude))) {
        payload.latitude = Number(latitude);
      }
      if (longitude && !isNaN(Number(longitude))) {
        payload.longitude = Number(longitude);
      }
      if (description.trim()) {
        payload.description = description.trim();
      }

      const response = await fetch("http://localhost:3000/rescue-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || "Không thể gửi yêu cầu. Vui lòng thử lại.";
        throw new Error(msg);
      }

      const data: RescueRequestData = await response.json();
      setTrackedRequest(data);
      setSearchId(data.id);
      setTrackingError(null);
      scrollToSection("tracking-section");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi kết nối với máy chủ.";
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // Fetch Request Tracking -> Calls GET /rescue-requests/:id
  const handleTrackRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim();

    if (!cleanId) {
      setTrackingError("Vui lòng nhập mã yêu cầu (Request ID).");
      setTrackedRequest(null);
      return;
    }

    setTrackingLoading(true);
    setTrackingError(null);

    try {
      const response = await fetch(`http://localhost:3000/rescue-requests/${cleanId}`);

      if (response.status === 404) {
        throw new Error("Không tìm thấy yêu cầu cứu hộ với mã này.");
      }

      if (!response.ok) {
        throw new Error("Không thể kết nối đến hệ thống. Vui lòng thử lại.");
      }

      const data: RescueRequestData = await response.json();
      setTrackedRequest(data);
    } catch (err: unknown) {
      setTrackedRequest(null);
      const msg =
        err instanceof Error ? err.message : "Không thể kết nối đến hệ thống. Vui lòng thử lại.";
      setTrackingError(msg);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="space-y-12 py-4 sm:space-y-16">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Two-Column Layout)
         ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Modern Operational Hero Design)
         ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-10 lg:p-12 text-white shadow-xl">
        {/* Background Grid Pattern & Gradient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="absolute -top-24 -left-24 size-96 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          {/* LEFT COLUMN: Hero Copy & Emergency CTAs */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-red-400 backdrop-blur-md shadow-inner">
              <span className="size-2 rounded-full bg-red-500 animate-ping" />
              <span>HỆ THỐNG CỨU HỘ KHẨN CẤP MULTI-AGENCY 24/7</span>
            </div>

            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              Cứu hộ <span className="bg-gradient-to-r from-red-400 via-orange-300 to-amber-300 bg-clip-text text-transparent">nhanh hơn.</span> <br />
              Đến đúng nơi <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">an toàn hơn.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              Nền tảng tiếp nhận vị trí GPS khẩn cấp, xác minh tình trạng ngập lụt và điều phối lực lượng cứu hộ chuyên nghiệp đến tận hộ gia đình trong vùng lũ.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection("rescue-form")}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-red-600/30 transition-all hover:from-red-500 hover:to-rose-500 hover:shadow-red-600/50 active:scale-[0.98]"
              >
                <span className="text-xl">🚨</span>
                <span>Yêu cầu cứu hộ khẩn cấp</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("tracking-section")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-4 text-base font-bold text-slate-200 shadow-md backdrop-blur-md transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-[0.98]"
              >
                <span>🔍</span>
                <span>Tra cứu mã yêu cầu</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> GPS Định vị tự động
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Phân công Đội cứu hộ gần nhất
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Hỗ trợ SMS khi mất mạng
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Radar & Operational Tactical Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <img src="/favicon.png" alt="Icon" className="size-5 rounded object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">BẢN ĐỒ CHỈ HUY LIVE</h3>
                    <p className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                      LIVE TELEMETRY
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                  16.0354° N, 108.2207° E
                </span>
              </div>

              {/* Tactical Status Cards inside Hero */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-850 p-3.5 border border-red-500/30 bg-red-950/20">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-red-600/30 text-red-400 font-bold text-base shadow-inner">
                      🚨
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">Khu vực ngập sâu khẩn cấp</p>
                      <p className="text-[11px] text-slate-400 font-medium">Hòa Cường Nam, Hải Châu, Đà Nẵng</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-red-600/30 px-2.5 py-1 text-[10px] font-extrabold text-red-300 border border-red-500/40">
                    CRITICAL
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-850 p-3.5 border border-blue-500/30 bg-blue-950/20">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600/30 text-blue-400 font-bold text-base shadow-inner">
                      🚤
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">Đội Cứu Hộ Xuồng Máy #03</p>
                      <p className="text-[11px] text-blue-300 font-medium">Đang tiếp cận hiện trường (~1.2 km)</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-blue-600/30 px-2.5 py-1 text-[10px] font-extrabold text-blue-300 border border-blue-500/40">
                    ON MISSION
                  </span>
                </div>
              </div>

              {/* Operations Stats Quick Strip */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Tốc độ tiếp nhận</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">Tức thì (Realtime)</span>
                </div>
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Đội trực ban</span>
                  <span className="text-sm font-extrabold text-blue-400 font-mono">Sẵn sàng 24/7</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                <span>Trung tâm tiếp nhận: <strong className="text-slate-200 font-bold">Đà Nẵng & Miền Trung</strong></span>
                <a href="tel:112" className="font-extrabold text-red-400 hover:text-red-300 font-mono text-sm">☎ 112</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. OPERATIONAL STATUS BAR
         ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
          </span>
          <p className="text-sm font-bold text-slate-900">
            HỆ THỐNG ĐANG HOẠT ĐỘNG
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-amber-700 border border-amber-200">
            4 tình trạng khẩn cấp đang được xử lý
          </span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. RESCUE REQUEST FORM (Structured 4-Section Form)
         ───────────────────────────────────────────────────────────── */}
      <section id="rescue-form" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            BIỂU MẪU ĐĂNG KÝ CỨU HỘ
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Yêu cầu cứu hộ khẩn cấp
          </h2>
          <p className="text-sm text-slate-600">
            Vui lòng cung cấp đầy đủ thông tin bên dưới để trung tâm điều phối và đội cứu hộ tiếp cận nhanh nhất.
          </p>
        </div>

        {/* Error Alert Message */}
        {formError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            ⚠️ {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* 01 — VỊ TRÍ CẦN CỨU HỘ */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                  01
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    VỊ TRÍ CẦN CỨU HỘ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hãy cho phép hệ thống xác định vị trí hiện tại của bạn để đội cứu hộ tiếp cận chính xác nhất.
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS: GPS & MAP PICKER */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  disabled={gpsLoading}
                  onClick={handleDetectGPS}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {gpsLoading ? (
                    <>
                      <span className="animate-spin">↻</span>
                      <span>Đang xác định vị trí...</span>
                    </>
                  ) : (
                    <>
                      <span>📍</span>
                      <span>Lấy vị trí hiện tại của tôi</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <span>🗺️</span>
                  <span>{showMapPicker ? "Ẩn bản đồ" : "Chọn vị trí trên bản đồ"}</span>
                </button>
              </div>
            </div>

            {/* GPS Error Message */}
            {gpsError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-medium space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span>⚠️</span> <span>Không thể lấy GPS tự động</span>
                </div>
                <p>{gpsError}</p>
              </div>
            )}

            {/* Location Status & Accuracy Info */}
            {latitude && longitude && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">📍 Vị trí của bạn:</span>
                    {gpsAccuracy ? (
                      <span className="font-semibold text-slate-700">
                        Độ chính xác: ~{gpsAccuracy}m
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">(Chọn thủ công trên bản đồ)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {gpsAccuracy && (
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs ${getAccuracyRating(gpsAccuracy).className}`}>
                        {getAccuracyRating(gpsAccuracy).label}
                      </span>
                    )}

                    {/* Location Confirmation Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setLocationConfirmed(!locationConfirmed)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all shadow-2xs ${
                        locationConfirmed
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {locationConfirmed ? (
                        <>
                          <span>✓</span>
                          <span>Đã xác nhận vị trí</span>
                        </>
                      ) : (
                        <>
                          <span>🎯</span>
                          <span>Xác nhận vị trí này</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Actionable guidance if GPS accuracy is poor (>50m) */}
                {gpsAccuracy && gpsAccuracy > 50 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                    <span className="text-amber-600">💡</span>
                    <span>
                      Tín hiệu GPS có độ chính xác thấp. Bạn có thể di chuyển ra nơi thoáng hơn hoặc chạm/kéo thả ghim trên bản đồ bên dưới để chọn vị trí chính xác nhất.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Leaflet Map Picker */}
            {(showMapPicker || (latitude && longitude)) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">🗺️ BẢN ĐỒ VIỆT NAM (Chạm hoặc kéo thả ghim để điều chỉnh):</span>
                  <span>© OpenStreetMap</span>
                </div>

                <RescueMap
                  center={[
                    latitude ? Number(latitude) : 16.047079,
                    longitude ? Number(longitude) : 108.20623,
                  ]}
                  zoom={latitude && longitude ? 15 : 12}
                  draggableMarker={
                    latitude && longitude
                      ? {
                          latitude: Number(latitude),
                          longitude: Number(longitude),
                          accuracy: gpsAccuracy,
                          isGPS: isGPSDetected,
                          onDragEnd: handleMapPositionChange,
                        }
                      : undefined
                  }
                  onMapClick={handleMapPositionChange}
                  className="h-64 sm:h-80 w-full rounded-xl overflow-hidden border border-slate-300 shadow-2xs"
                />
              </div>
            )}

            {/* Address Field with Geocoding Loading Indicator & Bi-directional Address-to-Map Search */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Địa chỉ hiện tại <span className="text-red-600">*</span>
                </label>
                {geocodingLoading ? (
                  <span className="text-xs font-semibold text-blue-600 animate-pulse flex items-center gap-1">
                    <span>🔍</span> Đang dịch tọa độ từ bản đồ...
                  </span>
                ) : searchGeocodeLoading ? (
                  <span className="text-xs font-semibold text-blue-600 animate-pulse flex items-center gap-1">
                    <span>🗺️</span> Đang tìm vị trí trên bản đồ...
                  </span>
                ) : isAutoGeocoded ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <span>✨</span> Đã tự động điền từ bản đồ
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    id="address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setIsAutoGeocoded(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLocateAddressOnMap();
                      }
                    }}
                    placeholder="Ví dụ: Tân An, TPHCM hoặc Số 12 Võ Văn Tần, Q3, TPHCM..."
                    className={`w-full rounded-xl border bg-white pl-3.5 pr-10 py-2.5 text-sm text-slate-900 outline-none transition-all ${
                      isAutoGeocoded
                        ? "border-emerald-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-emerald-50/20"
                        : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {address && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddress("");
                        setIsAutoGeocoded(false);
                        setAddressLocatedStatus(null);
                      }}
                      title="Xóa địa chỉ để gõ mới"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={searchGeocodeLoading || !address.trim()}
                  onClick={() => handleLocateAddressOnMap()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-600 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-all shrink-0"
                >
                  {searchGeocodeLoading ? (
                    <>
                      <span className="animate-spin">↻</span>
                      <span>Đang tìm...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Ghim trên bản đồ</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status banner when address is located on map */}
              {addressLocatedStatus && (
                <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/80 p-2.5 text-xs text-blue-900 font-medium flex items-center justify-between">
                  <span>{addressLocatedStatus}</span>
                  <button
                    type="button"
                    onClick={() => setAddressLocatedStatus(null)}
                    className="text-blue-500 hover:text-blue-800 ml-2 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Helpful UX Prompt for Citizen */}
              <p className="mt-1.5 text-[11px] text-slate-500 flex items-start gap-1">
                <span>💡</span>
                <span>
                  <strong>Tính năng thông minh 2 chiều:</strong> Bạn có thể <em>nhập tên thành phố/quận/đường (VD: Tân An, TPHCM)</em> rồi nhấn <strong>"Ghim trên bản đồ"</strong> hoặc gõ Enter, hệ thống sẽ tự động tìm và di chuyển ghim bản đồ tới đó!
                </span>
              </p>
            </div>
          </div>

          {/* 02 — NGƯỜI CẦN HỖ TRỢ */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                02
              </span>
              <h3 className="font-display text-base font-bold text-slate-900">
                NGƯỜI CẦN HỖ TRỢ
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Số người cần cứu hộ <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPeopleCount(n)}
                      className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                        peopleCount === n
                          ? "bg-blue-600 text-white shadow-xs"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {n} {n === 8 ? "+" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Đối tượng ưu tiên đặc biệt
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "children", label: "👶 Trẻ em" },
                    { key: "elderly", label: "👵 Người cao tuổi" },
                    { key: "injured", label: "🚑 Người bị thương" },
                  ].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => toggleVulnerableGroup(g.key)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        vulnerableGroups.includes(g.key)
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 03 — TÌNH TRẠNG */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                03
              </span>
              <h3 className="font-display text-base font-bold text-slate-900">
                MÔ TẢ TÌNH TRẠNG NGẬP LỤT
              </h3>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Chi tiết tình huống & Yêu cầu cụ thể
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nước ngập khoảng 1,2m, gia đình đang ở tầng 2, cần hỗ trợ di dời khẩn cấp..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* 04 — GỬI YÊU CẦU */}
          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={formLoading}
              className="w-full rounded-xl bg-red-600 py-4 font-display text-lg font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-50"
            >
              {formLoading ? "Đang gửi yêu cầu..." : "🚨 Gửi yêu cầu cứu hộ ngay"}
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowSms(true)}
                className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                📱 Gửi qua tin nhắn SMS (Khi mất Internet)
              </button>
              <a
                href="tel:112"
                className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2.5 text-center text-xs font-bold text-red-700 hover:bg-red-100"
              >
                ☎ Gọi đường dây nóng 112
              </a>
            </div>

            <p className="text-center text-xs text-slate-500">
              Thông tin sẽ được chuyển đến trung tâm điều phối để xác minh.
            </p>
          </div>
        </form>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. REAL CITIZEN REQUEST TRACKING SECTION
         ───────────────────────────────────────────────────────────── */}
      <section id="tracking-section" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            TRA CỨU TRỰC TUYẾN
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Theo dõi yêu cầu cứu hộ
          </h2>
          <p className="text-sm text-slate-600">
            Nhập mã Request ID để kiểm tra tiến trình xác minh, phân công và trạng thái cứu hộ theo thời gian thực từ cơ sở dữ liệu.
          </p>
        </div>

        {/* Tracking Search Input Form */}
        <form onSubmit={handleTrackRequest} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Nhập mã Request ID (Ví dụ: 91833e63-5f1b-4288-a949-41ef10ebefed)"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
          />
          <button
            type="submit"
            disabled={trackingLoading}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {trackingLoading ? "Đang tra cứu..." : "🔍 Tra cứu yêu cầu"}
          </button>
        </form>

        {/* Error Alert View */}
        {trackingError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 max-w-2xl">
            ⚠️ {trackingError}
          </div>
        )}

        {/* Tracked Result View Card & Status Timeline */}
        {trackedRequest && (
          <div className="space-y-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  MÃ YÊU CẦU (REQUEST ID)
                </p>
                <p className="font-mono text-base font-bold text-slate-900">
                  {trackedRequest.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={trackedRequest.status} />
                <PriorityBadge priority={trackedRequest.priority} />
              </div>
            </div>

            {/* Request Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">📍 Địa điểm:</p>
                <p className="font-medium text-slate-900">{trackedRequest.locationAddress}</p>
                {trackedRequest.latitude && trackedRequest.longitude && (
                  <p className="text-xs font-mono text-slate-500">
                    Tọa độ: {trackedRequest.latitude}, {trackedRequest.longitude}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">👥 Số người hỗ trợ:</p>
                <p className="font-medium text-slate-900">{trackedRequest.peopleCount} người</p>
              </div>
              <div className="md:col-span-2 space-y-1">
                <p className="text-xs font-semibold text-slate-500">📝 Mô tả tình trạng:</p>
                <p className="font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
                  {trackedRequest.description || "Không có mô tả thêm."}
                </p>
              </div>
              <div className="text-xs text-slate-500">
                🕒 Thời gian gửi: <strong className="text-slate-700">{new Date(trackedRequest.createdAt).toLocaleString("vi-VN")}</strong>
              </div>
              <div className="text-xs text-slate-500">
                🔄 Cập nhật lần cuối: <strong className="text-slate-700">{new Date(trackedRequest.updatedAt).toLocaleString("vi-VN")}</strong>
              </div>
            </div>

            {/* Visual Status Timeline */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                TIẾN TRÌNH CỨU HỘ REAL-TIME
              </p>

              {/* Check for special alternative states */}
              {trackedRequest.status === "INVALID" ? (
                <div className="rounded-lg bg-red-100 border border-red-300 p-4 text-sm font-bold text-red-900">
                  ❌ Yêu cầu này đã được điều phối viên xác minh là KHÔNG HỢP LỆ (INVALID).
                </div>
              ) : trackedRequest.status === "RESCUE_FAILED" ? (
                <div className="rounded-lg bg-red-100 border border-red-300 p-4 text-sm font-bold text-red-900">
                  ⚠️ Nhiệm vụ cứu hộ đợt 1 thất bại. Trung tâm điều phối đang chuyển yêu cầu về danh sách chờ để điều động phương tiện mới.
                </div>
              ) : trackedRequest.status === "CANCELLED" ? (
                <div className="rounded-lg bg-slate-100 border border-slate-300 p-4 text-sm font-bold text-slate-700">
                  🚫 Yêu cầu cứu hộ đã được hủy.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Timeline Horizontal desktop / Vertical mobile */}
                  <div className="hidden lg:grid lg:grid-cols-7 gap-2">
                    {timelineStages.map((stage, idx) => {
                      const currentIdx = getStageIndex(trackedRequest.status);
                      const isPassed = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={stage.key}
                          className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                            isCurrent
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                              : isPassed
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium"
                              : "bg-white text-slate-400 border-slate-200"
                          }`}
                        >
                          <span className="text-xs font-mono mb-1">Step {stage.stepNum}</span>
                          <span className="text-[11px] leading-tight">{stage.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Vertical Timeline List */}
                  <ol className="space-y-3 pl-4 lg:hidden">
                    {timelineStages.map((stage, idx) => {
                      const currentIdx = getStageIndex(trackedRequest.status);
                      const isPassed = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <li key={stage.key} className="relative flex items-center gap-3">
                          <span
                            className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                              isCurrent
                                ? "bg-blue-600 text-white ring-2 ring-blue-300"
                                : isPassed
                                ? "bg-emerald-600 text-white"
                                : "border border-slate-300 bg-slate-100 text-slate-400"
                            }`}
                          >
                            {isPassed ? "✓" : stage.stepNum}
                          </span>
                          <p
                            className={`text-xs ${
                              isCurrent
                                ? "font-bold text-blue-700"
                                : isPassed
                                ? "font-semibold text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {stage.label}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. RESCUE PROCESS SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            QUY TRÌNH XỬ LÝ
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Các bước cứu hộ khẩn cấp
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {processSteps.map((step) => (
            <div
              key={step.num}
              className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-2"
            >
              <span className="inline-block font-display text-2xl font-black text-blue-600">
                {step.num}
              </span>
              <h3 className="font-display text-base font-bold text-slate-900">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. SYSTEM CAPABILITIES SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            NĂNG LỰC HỆ THỐNG
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Trung tâm chỉ huy hỗ trợ
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-lg">
              📡
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Theo dõi yêu cầu</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quản lý và cập nhật trạng thái yêu cầu cứu hộ theo thời gian thực.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-lg">
              🏢
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Điều phối tập trung</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tiếp nhận, xác minh và đánh giá tính chính xác của các yêu cầu từ người dân.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-lg">
              🚤
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Phân công đội cứu hộ</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kết nối và điều động đội cứu hộ có năng lực và vị trí phù hợp nhất.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-lg">
              ⚡
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Ưu tiên khẩn cấp</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Phân loại mức độ ưu tiên LOW, MEDIUM, HIGH, CRITICAL để cứu người kịp thời.
            </p>
          </div>
        </div>
      </section>

      <SmsFallback open={showSms} onClose={() => setShowSms(false)} />
    </div>
  );
}
