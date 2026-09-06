# Cứu Hộ Việt

Create a modern responsive web application UI prototype for:

"Cứu Hộ Lũ — Flood Rescue & Relief"

PRODUCT VISION

Build a disaster response platform designed for Vietnam first,

with the ability to scale internationally in the future.

The primary use case is flood rescue and relief coordination,

especially for flood-prone regions such as Central Vietnam.

The default UI language must be Vietnamese.

The system architecture and UI should be designed so English and

other languages can be added later.

IMPORTANT:

- UI text must be Vietnamese by default.

- Do NOT mix Vietnamese and English unnecessarily in the interface.

- Use English only for technical/product concepts where appropriate.

- Do NOT implement a real backend.

- Use realistic mock data.

- Focus on UI/UX and user flows.

- Do NOT create database logic.

TARGET USERS

1. Người dân

2. Đội cứu hộ

3. Điều phối viên cứu hộ

4. Quản lý cứu trợ

5. Quản trị viên

CITIZEN EXPERIENCE

The citizen interface must be extremely simple because users may be

in stressful emergency situations.

Main actions:

- Gửi yêu cầu cứu hộ

- Chia sẻ vị trí hiện tại

- Mô tả tình trạng

- Cho biết số người cần hỗ trợ

- Đánh dấu trẻ em / người cao tuổi / người bị thương

- Tải ảnh hiện trường

- Theo dõi trạng thái cứu hộ

- Xem đội cứu hộ được phân công

The main emergency action should be highly visible:

"🚨 YÊU CẦU CỨU HỘ"

Example emergency statuses:

- Đang chờ xác minh

- Đã xác minh

- Đang tìm đội cứu hộ

- Đã phân công

- Đang cứu hộ

- Đã hoàn tất

- Đã hủy

RESCUE COORDINATOR

Create a command-center style dashboard.

The coordinator should be able to quickly see:

- Tổng số yêu cầu cứu hộ

- Yêu cầu khẩn cấp

- Yêu cầu chưa xử lý

- Đội cứu hộ đang hoạt động

- Đội cứu hộ sẵn sàng

- Vị trí các yêu cầu trên bản đồ

- Vị trí các đội cứu hộ

- Trạng thái phương tiện

Main workflow:

Yêu cầu cứu hộ

→ Xác minh

→ Đánh giá mức độ ưu tiên

→ Phân công đội cứu hộ

→ Theo dõi

→ Hoàn tất

RESCUE TEAM

The rescue team dashboard should focus on active assignments.

Display:

- Nhiệm vụ được giao

- Mức độ ưu tiên

- Vị trí cần cứu hộ

- Số người cần hỗ trợ

- Thông tin tình trạng

- Phương tiện

- Trạng thái nhiệm vụ

Actions:

- Nhận nhiệm vụ

- Từ chối nhiệm vụ

- Bắt đầu cứu hộ

- Cập nhật trạng thái

- Hoàn tất cứu hộ

RELIEF MANAGER

Create a dashboard for:

- Kho cứu trợ

- Nguồn hàng

- Nước uống

- Lương thực

- Thuốc men

- Chăn màn

- Tiếp nhận quyên góp

- Phân bổ cứu trợ

- Theo dõi phân phối

ADMIN

Create administrative pages for:

- Người dùng

- Vai trò

- Khu vực

- Đội cứu hộ

- Phương tiện

- Cấu hình hệ thống

- Báo cáo

DESIGN DIRECTION

The design should feel like a real Vietnamese disaster-response

platform rather than a generic SaaS dashboard.

Prioritize:

- Simplicity

- High readability

- Fast recognition

- Mobile responsiveness

- Accessibility

- Emergency visibility

- Map-based coordination

- Clear status indicators

- Large touch-friendly buttons for citizens

The citizen experience should be mobile-first.

The coordinator and manager dashboards can be desktop-first.

GEOGRAPHIC CONTEXT

Use realistic Vietnamese mock locations such as:

- Đà Nẵng

- Huế

- Quảng Trị

- Quảng Bình

- Quảng Nam

Use Vietnamese address concepts such as:

- Tỉnh / Thành phố

- Quận / Huyện

- Phường / Xã

However, do NOT hard-code these geographic concepts into the

core architecture because the platform should support international

deployment later.

INTERNATIONALIZATION

Design the UI so that text can later be translated.

Avoid hardcoding language-specific text directly into reusable

components.

Prepare conceptually for:

Vietnamese:

"Yêu cầu cứu hộ"

English:

"Request Rescue"

Do not implement full internationalization yet.

Only make the UI structure compatible with it.

Create the main pages, navigation, dashboards and emergency request

flow using realistic Vietnamese mock data.

Do not implement backend, database, authentication or AI yet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fa40f33a-7b95-42e2-9721-e9adfa770a0a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
