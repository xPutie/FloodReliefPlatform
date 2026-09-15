import type { GeoCoordinates, GPSAccuracyInfo } from "./types";

export function getAccuracyRating(accuracyMeters?: number): GPSAccuracyInfo {
  if (!accuracyMeters || accuracyMeters <= 0) {
    return {
      rating: "MODERATE",
      label: "Độ chính xác tương đối",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }

  if (accuracyMeters <= 20) {
    return {
      rating: "EXCELLENT",
      label: "Vị trí chính xác cao",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
    };
  }

  if (accuracyMeters <= 50) {
    return {
      rating: "GOOD",
      label: "Vị trí khá chính xác",
      className: "bg-sky-50 text-sky-800 border-sky-200 font-semibold",
    };
  }

  if (accuracyMeters <= 100) {
    return {
      rating: "MODERATE",
      label: "Có thể cần kiểm tra lại vị trí",
      className: "bg-amber-50 text-amber-900 border-amber-200 font-medium",
    };
  }

  return {
    rating: "POOR",
    label: "Độ chính xác thấp — vui lòng kiểm tra hoặc chọn lại vị trí trên bản đồ",
    className: "bg-rose-50 text-rose-900 border-rose-200 font-medium",
  };
}

export function getCurrentBrowserLocation(): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return reject(new Error("Trình duyệt của bạn không hỗ trợ xác định vị trí GPS."));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
        });
      },
      (error) => {
        let msg = "Không thể lấy vị trí tự động.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật định vị hoặc chọn trực tiếp trên bản đồ.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Tín hiệu GPS không khả dụng. Bạn có thể chọn vị trí trực tiếp trên bản đồ.";
            break;
          case error.TIMEOUT:
            msg = "Quá thời gian xác định vị trí GPS. Vui lòng chọn vị trí trên bản đồ.";
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}
