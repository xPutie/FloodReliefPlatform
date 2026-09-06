/**
 * Minimal translation layer. Only Vietnamese is shipped today, but every
 * user-facing string in reusable components goes through `t()` so other
 * locales can be added later without touching component code.
 */

export type Locale = "vi";

export const defaultLocale: Locale = "vi";

const vi = {
  "app.name": "Cứu Hộ Lũ",
  "app.tagline": "Trung tâm chỉ huy",

  "nav.citizen": "Người dân",
  "nav.coordinator": "Điều phối",
  "nav.team": "Đội cứu hộ",
  "nav.relief": "Cứu trợ",
  "nav.admin": "Quản trị",

  "header.emergencyCount": "tình trạng khẩn cấp",
  "header.search": "Tìm địa điểm, đội…",
  "header.live": "Cập nhật trực tiếp",

  "common.viewAll": "Xem tất cả",
  "common.people": "người",
  "common.members": "thành viên",
  "common.priority": "Mức độ ưu tiên",
  "common.location": "Vị trí",
  "common.status": "Trạng thái",
  "common.note": "Ghi chú",
  "common.time": "Thời gian",

  "priority.critical": "Khẩn cấp",
  "priority.high": "Cao",
  "priority.medium": "Trung bình",
  "priority.low": "Thấp",

  "status.pending": "Đang chờ xác minh",
  "status.verified": "Đã xác minh",
  "status.searching": "Đang tìm đội cứu hộ",
  "status.assigned": "Đã phân công",
  "status.rescuing": "Đang cứu hộ",
  "status.done": "Đã hoàn tất",
  "status.cancelled": "Đã hủy",

  "vehicle.available": "Sẵn sàng",
  "vehicle.inUse": "Đang dùng",
  "vehicle.patrol": "Bay tuần tra",
  "vehicle.maintenance": "Bảo trì",

  "team.available": "Sẵn sàng",
  "team.rescuing": "Đang cứu hộ",
  "team.resting": "Nghỉ",

  "citizen.title": "Yêu cầu cứu hộ khẩn cấp",
  "citizen.cta": "🚨 YÊU CẦU CỨU HỘ",
  "citizen.ctaHint": "Nhấn để gửi yêu cầu cứu hộ",
  "citizen.smsAction": "Không có Internet? Gửi yêu cầu qua SMS →",
  "citizen.sms.title": "Gửi yêu cầu cứu hộ qua SMS",
  "citizen.sms.intro":
    "Khi bạn có sóng di động nhưng không có Internet, hãy gửi tin nhắn SMS theo đúng định dạng để đội cứu hộ nhận được yêu cầu.",
  "citizen.sms.number": "Số SMS khẩn cấp",
  "citizen.sms.format": "Định dạng tin nhắn",
  "citizen.sms.formatExample": "CUUHO|<số người>|<trẻ em|cao tuổi|bị thương>|<địa chỉ>",
  "citizen.sms.formatHint": "Ví dụ: CUUHO|4|tre em|Phường Hòa Cường Nam, Hải Châu, Đà Nẵng",
  "citizen.sms.openApp": "MỞ ỨNG DỤNG SMS",
  "citizen.sms.close": "Đóng",
  "citizen.shareLocation": "Chia sẻ vị trí hiện tại",
  "citizen.locating": "Đang xác định vị trí…",
  "citizen.peopleCount": "Số người cần hỗ trợ",
  "citizen.vulnerable": "Đối tượng cần chú ý",
  "citizen.children": "Trẻ em",
  "citizen.elderly": "Người cao tuổi",
  "citizen.injured": "Người bị thương",
  "citizen.describe": "Mô tả tình trạng",
  "citizen.describePlaceholder": "Ví dụ: nước ngập 1,2m, gia đình đang ở tầng 2…",
  "citizen.photo": "Tải ảnh hiện trường",
  "citizen.photoHint": "Ảnh giúp đội cứu hộ chuẩn bị phương tiện phù hợp",
  "citizen.submit": "Gửi yêu cầu cứu hộ",
  "citizen.submitted": "Đã gửi yêu cầu",
  "citizen.tracking": "Theo dõi trạng thái cứu hộ",
  "citizen.assignedTeam": "Đội cứu hộ được phân công",
  "citizen.hotline": "Tổng đài khẩn cấp 112",


  "coordinator.title": "Phòng kiểm soát khẩn cấp",
  "coordinator.region": "Khu vực miền Trung",
  "coordinator.totalRequests": "Tổng yêu cầu",
  "coordinator.urgent": "Khẩn cấp",
  "coordinator.unhandled": "Đang chờ xử lý",
  "coordinator.activeTeams": "Đội đang hoạt động",
  "coordinator.readyTeams": "Đội sẵn sàng",
  "coordinator.map": "Bản đồ thời gian thực",
  "coordinator.vehicles": "Trạng thái phương tiện",
  "coordinator.liveRequests": "Yêu cầu cứu hộ theo thời gian thực",
  "coordinator.onDutyTeams": "Đội cứu hộ trực",
  "coordinator.workflow": "Quy trình điều phối",
  "coordinator.verify": "Xác minh",
  "coordinator.assign": "Phân công đội cứu hộ",

  "team.title": "Nhiệm vụ của đội",
  "team.assignments": "Nhiệm vụ được giao",
  "team.accept": "Nhận nhiệm vụ",
  "team.decline": "Từ chối",
  "team.start": "Bắt đầu cứu hộ",
  "team.update": "Cập nhật trạng thái",
  "team.complete": "Hoàn tất cứu hộ",
  "team.vehicle": "Phương tiện",

  "relief.title": "Quản lý cứu trợ",
  "relief.warehouses": "Kho cứu trợ",
  "relief.stock": "Nguồn hàng",
  "relief.water": "Nước uống",
  "relief.food": "Lương thực",
  "relief.medicine": "Thuốc men",
  "relief.blanket": "Chăn màn",
  "relief.donations": "Tiếp nhận quyên góp",
  "relief.allocation": "Phân bổ cứu trợ",
  "relief.distribution": "Theo dõi phân phối",

  "admin.title": "Quản trị hệ thống",
  "admin.users": "Người dùng",
  "admin.roles": "Vai trò",
  "admin.areas": "Khu vực",
  "admin.teams": "Đội cứu hộ",
  "admin.vehicles": "Phương tiện",
  "admin.settings": "Cấu hình hệ thống",
  "admin.reports": "Báo cáo",
} as const;

export type TranslationKey = keyof typeof vi;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { vi };

export function t(key: TranslationKey, locale: Locale = defaultLocale): string {
  return dictionaries[locale][key] ?? key;
}
