import type { TranslationKey } from "./i18n";

export type RequestStatus =
  | "pending"
  | "verified"
  | "searching"
  | "assigned"
  | "rescuing"
  | "done"
  | "cancelled";

export type Priority = "critical" | "high" | "medium" | "low";

/** Address is generic on purpose so non-Vietnamese deployments can reuse it. */
export type AreaAddress = {
  level1: string; // Tỉnh / Thành phố
  level2: string; // Quận / Huyện
  level3: string; // Phường / Xã
};

export type RescueRequest = {
  id: string;
  address: AreaAddress;
  people: number;
  children: number;
  elderly: number;
  injured: number;
  note: string;
  time: string;
  status: RequestStatus;
  priority: Priority;
  team?: string;
  x: number;
  y: number;
};

export const statusKey: Record<RequestStatus, TranslationKey> = {
  pending: "status.pending",
  verified: "status.verified",
  searching: "status.searching",
  assigned: "status.assigned",
  rescuing: "status.rescuing",
  done: "status.done",
  cancelled: "status.cancelled",
};

export const priorityKey: Record<Priority, TranslationKey> = {
  critical: "priority.critical",
  high: "priority.high",
  medium: "priority.medium",
  low: "priority.low",
};

export function formatAddress(a: AreaAddress) {
  return `${a.level3}, ${a.level2}, ${a.level1}`;
}

export const requests: RescueRequest[] = [
  {
    id: "CH-0421",
    address: { level1: "Đà Nẵng", level2: "Hải Châu", level3: "Phường Hòa Cường Nam" },
    people: 4,
    children: 1,
    elderly: 0,
    injured: 0,
    note: "Ngập 1,2m, gia đình đang ở tầng 2",
    time: "05:38",
    status: "pending",
    priority: "critical",
    x: 18,
    y: 28,
  },
  {
    id: "CH-0419",
    address: { level1: "Huế", level2: "Phú Vang", level3: "Phường Phú Mỹ" },
    people: 3,
    children: 0,
    elderly: 1,
    injured: 0,
    note: "Sập cầu, không thể di chuyển bằng đường bộ",
    time: "05:29",
    status: "searching",
    priority: "high",
    x: 40,
    y: 58,
  },
  {
    id: "CH-0416",
    address: { level1: "Quảng Trị", level2: "Gio Linh", level3: "Xã Gio Thành" },
    people: 2,
    children: 0,
    elderly: 0,
    injured: 1,
    note: "Một người bị thương ở chân, cần sơ cứu",
    time: "05:21",
    status: "assigned",
    priority: "high",
    team: "Đội 03",
    x: 64,
    y: 42,
  },
  {
    id: "CH-0412",
    address: { level1: "Quảng Bình", level2: "Lộc Ninh", level3: "Phường Lộc Ninh" },
    people: 5,
    children: 2,
    elderly: 1,
    injured: 0,
    note: "Nước rút chậm, đã đưa lên nhà văn hóa xã",
    time: "05:12",
    status: "done",
    priority: "medium",
    team: "Đội 05",
    x: 74,
    y: 68,
  },
  {
    id: "CH-0409",
    address: { level1: "Quảng Nam", level2: "Duy Xuyên", level3: "Xã Duy Vinh" },
    people: 6,
    children: 1,
    elderly: 2,
    injured: 0,
    note: "Cụm 3 hộ dân bị cô lập ven sông Thu Bồn",
    time: "05:02",
    status: "rescuing",
    priority: "critical",
    team: "Đội 03",
    x: 52,
    y: 78,
  },
];

export type Team = {
  id: string;
  code: string;
  name: string;
  members: number;
  vehicle: string;
  state: "rescuing" | "available" | "resting";
};

export const teams: Team[] = [
  { id: "t3", code: "Đ3", name: "Đội 03 — Sông Thu Bồn", members: 4, vehicle: "Canoe 02", state: "rescuing" },
  { id: "t5", code: "Đ5", name: "Đội 05 — Đèo Hải Vân", members: 6, vehicle: "Trực thăng R-04", state: "available" },
  { id: "t2", code: "Đ2", name: "Đội 02 — Cửa Đại", members: 3, vehicle: "Canoe 01", state: "resting" },
  { id: "t7", code: "Đ7", name: "Đội 07 — Thạch Hãn", members: 5, vehicle: "Xe tải T-08", state: "available" },
];

export type Vehicle = {
  id: string;
  icon: string;
  name: string;
  state: "available" | "inUse" | "patrol" | "maintenance";
};

export const vehicles: Vehicle[] = [
  { id: "v1", icon: "🚤", name: "Canoe 01", state: "available" },
  { id: "v2", icon: "🚤", name: "Canoe 02", state: "inUse" },
  { id: "v3", icon: "🚁", name: "Trực thăng R-04", state: "patrol" },
  { id: "v4", icon: "🚐", name: "Xe tải T-08", state: "maintenance" },
];

export type ReliefItem = {
  id: string;
  labelKey: TranslationKey;
  icon: string;
  stock: number;
  unit: string;
  allocated: number;
};

export const reliefItems: ReliefItem[] = [
  { id: "r1", labelKey: "relief.water", icon: "💧", stock: 12400, unit: "chai", allocated: 8200 },
  { id: "r2", labelKey: "relief.food", icon: "🍚", stock: 5600, unit: "suất", allocated: 3100 },
  { id: "r3", labelKey: "relief.medicine", icon: "💊", stock: 980, unit: "bộ", allocated: 420 },
  { id: "r4", labelKey: "relief.blanket", icon: "🛏️", stock: 2300, unit: "bộ", allocated: 1500 },
];

export const warehouses = [
  { id: "w1", name: "Kho Hòa Vang", area: "Đà Nẵng", capacity: 82 },
  { id: "w2", name: "Kho Thuận Hóa", area: "Huế", capacity: 64 },
  { id: "w3", name: "Kho Đông Hà", area: "Quảng Trị", capacity: 41 },
];

export const donations = [
  { id: "d1", donor: "Hội Chữ thập đỏ Đà Nẵng", item: "Nước uống · 3.000 chai", time: "05:31" },
  { id: "d2", donor: "Công ty TNHH Trường Sơn", item: "Lương thực · 1.200 suất", time: "05:14" },
  { id: "d3", donor: "Nhóm thiện nguyện Huế Thương", item: "Chăn màn · 400 bộ", time: "04:58" },
];

export const distributions = [
  { id: "p1", area: "Phường Hòa Cường Nam, Đà Nẵng", item: "Nước uống · 800 chai", progress: 100 },
  { id: "p2", area: "Xã Gio Thành, Quảng Trị", item: "Lương thực · 450 suất", progress: 62 },
  { id: "p3", area: "Phường Phú Mỹ, Huế", item: "Thuốc men · 120 bộ", progress: 28 },
];

export const users = [
  { id: "u1", name: "Trần Đình Quân", role: "Điều phối viên cứu hộ", area: "Đà Nẵng", active: true },
  { id: "u2", name: "Nguyễn Thị Hòa", role: "Quản lý cứu trợ", area: "Huế", active: true },
  { id: "u3", name: "Lê Văn Sơn", role: "Đội trưởng đội cứu hộ", area: "Quảng Trị", active: true },
  { id: "u4", name: "Phạm Minh Tuấn", role: "Quản trị viên", area: "Toàn quốc", active: true },
  { id: "u5", name: "Hoàng Thu Trang", role: "Người dân", area: "Quảng Nam", active: false },
];

export const areas = [
  { id: "a1", level1: "Đà Nẵng", districts: 8, wards: 56, requests: 42 },
  { id: "a2", level1: "Huế", districts: 9, wards: 141, requests: 31 },
  { id: "a3", level1: "Quảng Trị", districts: 10, wards: 125, requests: 24 },
  { id: "a4", level1: "Quảng Bình", districts: 8, wards: 151, requests: 18 },
  { id: "a5", level1: "Quảng Nam", districts: 18, wards: 241, requests: 13 },
];
