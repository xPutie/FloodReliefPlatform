# 🚨 Cứu Hộ Việt — Flood Rescue & Relief Platform

> **Nền tảng tiếp nhận, xác minh, điều phối cứu hộ và quản lý cứu trợ lũ lụt khẩn cấp thời gian thực.**  
> Được thiết kế tối ưu cho công tác cứu hộ thiên tai tại Việt Nam với trải nghiệm đơn giản cho người dân và trung tâm chỉ huy 24/7 hiện đại cho ban điều phối.

---

## 📌 Tổng Quan Dự Án (Product Overview)

Trong các đợt mưa lũ lịch sử, việc kết nối thông tin giữa **người dân bị nạn** và **lực lượng cứu hộ** là yếu tố sống còn. **Cứu Hộ Việt** cung cấp một giải pháp công nghệ toàn diện giúp:
- **Người dân**: Gửi vị trí GPS / địa chỉ ngập lụt khẩn cấp chỉ với vài thao tác đơn giản, không bị bối rối khi căng thẳng.
- **Điều phối viên**: Giám sát bản đồ cứu hộ thời gian thực, xác minh yêu cầu, nhận gợi ý đội cứu hộ phù hợp nhất theo khoảng cách thực tế và điều động nhiệm vụ chính xác.
- **Đội cứu hộ**: Nhận thông báo nhiệm vụ tác chiến, xem thông tin số lượng người nạn nhân (người già, trẻ em, người thương vong), dẫn đường và cập nhật trạng thái nhiệm vụ.
- **Quản lý cứu trợ**: Quản lý kho lương thực, thuốc men, nhu yếu phẩm và điều phối phân bổ đến các vùng ngập sâu.
- **Quản trị viên**: Theo dõi Operational Intelligence Dashboard, xem nhật ký thao tác (Audit Log) server-side toàn bộ hệ thống.

---

## 🚀 Tính Năng Nổi Bật (Key Features)

### 🚨 1. Tiếp Nhận Cứu Hộ Khẩn Cấp (Citizen Experience)
- **Tự động định vị GPS & Tìm kiếm Địa chỉ**: Sử dụng Leaflet & OpenStreetMap Nominatim Reverse Geocoding để xác định tọa độ và địa chỉ chi tiết.
- **Phân loại Mức độ Nguy cấp**: Đánh dấu tình trạng ngập (nước dâng cao, trên mái nhà, thiếu lương thực), thông tin nhóm dễ bị tổn thương (trẻ em, người cao tuổi, phụ nữ mang thai, người bị thương).
- **Theo dõi Tiến độ Realtime**: Người dân tra cứu mã yêu cầu hoặc xem tiến trình xử lý ngay trên giao diện web.

### 🎯 2. Trung Tâm Điều Phối 24/7 (Coordinator Command Center)
- **Bản Đồ Tác Chiến Tương Tác**: Hiển thị trực quan vị trí các điểm cứu hộ khẩn cấp và các đội cứu hộ đang sẵn sàng hoặc đang làm nhiệm vụ.
- **Thuật Toán Đề Xuất Đội Cứu Hộ (Smart Dispatch Intelligence)**:
  - Tính toán khoảng cách thực tế giữa vị trí nạn nhân và các đội cứu hộ bằng công thức Haversine.
  - Xếp hạng thứ tự ưu tiên các đội cứu hộ khả thi nhất gần vị trí sự cố.
- **Phòng Chống Phân Công Trùng Lặp (Concurrent Dispatch Protection)**: Khóa giao dịch Prisma ACID server-side phòng tránh 2 điều phối viên cùng giao 1 đội cứu hộ hoặc 1 yêu cầu bị nhận trùng.

### 🛡️ 3. Quản Lý Nhiệm Vụ & Nhật Ký Thao Tác (Mission Lifecycle & Audit Trail)
- **Vòng Đời Nhiệm Vụ Khép Kín**: `WAITING_VERIFICATION` → `PRIORITIZED` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED` / `FAILED`.
- **Hệ Thống Audit Log Server-side**: Ghi lại 100% nhật ký hoạt động (Đăng nhập, Xác minh, Điều phối, Thay đổi trạng thái) bảo đảm tính minh bạch, không thể can thiệp từ client.
- **Operational Intelligence Dashboard**: Báo cáo tình hình thực tế, thời gian phản hồi trung bình, tỷ lệ hoàn tất nhiệm vụ và hỗ trợ xuất dữ liệu ra file **CSV (Standard Excel format)**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Frontend (Web Application)
- **Framework**: React 19, Vite, TanStack Router (File-based routing)
- **State & Data Fetching**: TanStack React Query v5
- **Styling & UI**: Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Sonner Toast
- **Bản đồ (Maps)**: Leaflet, React-Leaflet, OpenStreetMap Nominatim Geocoding API

### Backend (REST API Service)
- **Framework**: NestJS (TypeScript), Express
- **ORM & Database**: Prisma ORM, PostgreSQL (hoặc SQLite/MySQL tương thích)
- **Bảo mật & Phân quyền**: Passport-JWT, BcryptJS, RBAC Guards (Role-Based Access Control)
- **Architecture**: Monorepo managed with **npm workspaces** & **Turborepo**

---

## 📁 Cấu Trúc Dự Án (Repository Structure)

```text
c-u-h-vi-t/
├── apps/
│   └── api/                   # Backend NestJS REST API Service
│       ├── prisma/            # Database Schema & Migrations (Prisma)
│       └── src/
│           ├── analytics/     # Analytics & Operational Intelligence Module
│           ├── assignment/    # Assignment Lifecycle & Dispatch Module
│           ├── audit/         # Server-side Audit Logging & CSV Export Module
│           ├── auth/          # JWT Authentication & Guard Policies
│           ├── rescue-request/# Rescue Request Operations & Verification
│           └── rescue-team/   # Rescue Team Management & Status Updates
├── public/                    # Static Assets (Favicon, Logos)
├── src/                       # Frontend React Application
│   ├── auth/                  # Auth Context & Token Management
│   ├── components/            # Reusable UI Components & Leaflet Maps
│   ├── lib/                   # Dispatch Logic, Haversine Distance & Geocoding
│   ├── routes/                # TanStack File-based Routes
│   │   ├── index.tsx          # Hero & Live Emergency Telemetry
│   │   ├── cuu-tro.tsx        # Citizen Request Page
│   │   ├── dieu-phoi.tsx      # Coordinator Command Dashboard
│   │   ├── doi-cuu-ho.tsx     # Rescue Team Mission Page
│   │   ├── quan-tri.tsx       # Admin Analytics & Audit Logs
│   │   └── login.tsx          # Authentication Portal
│   └── styles.css             # Tailwind & Global Styles
├── setup.bat                  # Script cài đặt tự động toàn bộ dự án
├── start-dev.bat              # Script khởi động đồng thời Backend & Frontend
├── turbo.json                 # Turborepo Build Pipeline
└── package.json               # Root Workspace Package Configuration
```

---

## ⚡ Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start Guide)

### 📋 Yêu Cầu Tiền Đề (Prerequisites)
- **Node.js**: v18.0.0 trở lên (Khuyên dùng v20 LTS)
- **npm**: v10.0.0 trở lên
- **PostgreSQL Database** (hoặc cấu hình SQLite trong `apps/api/prisma/schema.prisma`)

---

### 🚀 Cách 1: Khởi Chạy Tự Động (Dành cho Windows)

Dự án đã tích hợp sẵn 2 script tự động hóa:

1. **Cài đặt toàn bộ dependencies & khởi tạo Prisma**:
   👉 Nhấp đúp chạy file `setup.bat` (hoặc chạy trong CMD):
   ```cmd
   .\setup.bat
   ```

2. **Khởi động đồng thời cả Backend API và Frontend Web**:
   👉 Nhấp đúp chạy file `start-dev.bat` (hoặc chạy trong CMD):
   ```cmd
   .\start-dev.bat
   ```
   - **Backend API**: Running at `http://localhost:3000`
   - **Frontend App**: Running at `http://localhost:5173` (hoặc cổng được cấp ngẫu nhiên)

---

### 🛠️ Cách 2: Cài Đặt Thủ Công (Manual Step-by-Step)

#### Bước 1: Clone Repository
```bash
git clone https://github.com/xPutie/c-u-h-vi-t.git
cd c-u-h-vi-t
```

#### Bước 2: Cài đặt Dependencies
```bash
# Cài đặt cho Root và các Workspaces
npm install

# Cài đặt cho Backend API
cd apps/api
npm install
cd ../..
```

#### Bước 3: Cấu hình Biến Môi Trường (Environment Variables)
Tạo file `.env` trong thư mục `apps/api/`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flood_rescue?schema=public"
JWT_SECRET="super-secret-jwt-key-flood-rescue-2026"
PORT=3000
```

Tạo file `.env` tại thư mục gốc (Root):
```env
VITE_API_URL="http://localhost:3000"
```

#### Bước 4: Khởi tạo Database với Prisma
```bash
cd apps/api
npx prisma db push
npx prisma generate
cd ../..
```

#### Bước 5: Khởi chạy ứng dụng

- **Khởi chạy Backend NestJS**:
  ```bash
  cd apps/api
  npm run start:dev
  ```

- **Khởi chạy Frontend React (Vite)** (mở cửa sổ terminal mới):
  ```bash
  npm run dev
  ```

---

## 🔑 Tài Khoản Thử Nghiệm & Phân Quyền (RBAC Roles)

Hệ thống hỗ trợ các vai trò đăng nhập với quyền hạn tương ứng:

| Vai Trò | Quyền Hạn Trong Hệ Thống |
| :--- | :--- |
| **CITIZEN** | Gửi yêu cầu cứu hộ, theo dõi tiến độ công khai |
| **COORDINATOR** | Phê duyệt yêu cầu, chạy thuật toán Dispatch đề xuất đội, phân công cứu hộ |
| **RESCUE_TEAM** | Tiếp nhận nhiệm vụ, cập nhật vị trí & trạng thái tác chiến cứu hộ |
| **RELIEF_MANAGER** | Quản lý kho vật tư, phân phối hàng cứu trợ |
| **ADMIN** | Xem dashboard Operational Intelligence, theo dõi Audit Log toàn hệ thống, quản lý tài khoản |

---

## 📡 Danh Sách API Endpoints Chính (REST API Matrix)

### Auth (`/auth`)
- `POST /auth/register` — Đăng ký tài khoản mới
- `POST /auth/login` — Đăng nhập & lấy JWT Token
- `GET /auth/me` — Lấy thông tin tài khoản hiện tại

### Yêu Cầu Cứu Hộ (`/rescue-request`)
- `POST /rescue-request` — Tạo yêu cầu cứu hộ khẩn cấp (Công khai)
- `GET /rescue-request` — Lấy danh sách yêu cầu (Có bộ lọc trạng thái/độ ưu tiên)
- `PATCH /rescue-request/:id/verify` — (Coordinator/Admin) Xác minh yêu cầu
- `PATCH /rescue-request/:id/prioritize` — (Coordinator/Admin) Đánh giá mức độ ưu tiên

### Phân Công & Điều Phối (`/assignment`)
- `POST /assignment` — (Coordinator/Admin) Phân công đội cứu hộ vào sự cố (Có khóa bảo vệ concurrency)
- `PATCH /assignment/:id/status` — (RescueTeam/Coordinator) Cập nhật trạng thái nhiệm vụ (`ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)

### Nhật Ký & Thống Kê (`/audit` & `/analytics`)
- `GET /audit` — (Admin) Lấy nhật ký Audit Log phân trang & tìm kiếm
- `GET /audit/export` — (Admin) Tải xuống tệp báo cáo Audit dạng CSV
- `GET /analytics/operational` — (Admin/Coordinator) Lấy các chỉ số Operational Intelligence realtime

---

## 📄 Giấy Phép & Đóng Góp (License & Contribution)

Dự án được phát triển vì cộng đồng, phục vụ cho công tác phòng chống thiên tai và cứu hộ cứu nạn tại Việt Nam.

- **License**: MIT License
- **Đóng góp**: Mọi ý kiến đóng góp, Issue hoặc Pull Request đều được hoan nghênh nhằm hoàn thiện hệ thống phục vụ bà con vùng lũ.

---

<p align="center">
  <b>🚨 Cứu Hộ Việt — Cứu Hộ Nhanh Hơn. An Toàn Hơn. 🚨</b>
</p>
