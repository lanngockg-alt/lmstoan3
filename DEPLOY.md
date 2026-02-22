# Hướng dẫn Triển khai Google Apps Script (LMS API)

Làm theo các bước dưới đây để biến Google Sheet của bạn thành một Web API hoạt động hoàn chỉnh.

## Bước 1: Chuẩn bị Database
1. Mở file Google Sheet của bạn.
2. Trên thanh menu, bạn sẽ thấy mục **"LMS Admin"** (nếu chưa thấy, hãy tải lại trang Sheet).
3. Chọn **LMS Admin** > **1. Khởi tạo Database**.
4. Đợi thông báo *"Đã khởi tạo database thành công!"*.
   - Script sẽ tự động tạo các sheet: `Users`, `Classes`, `Subjects`, `Modules`, `Lessons`, `Assignments`, `Evaluations`, `Resources`, `Announcements`, `Progress`.
   - Nếu sheet đã tồn tại, nó sẽ tự động thêm các cột còn thiếu.

## Bước 2: Triển khai Web App
1. Mở trình chỉnh sửa Apps Script (Extensions > Apps Script).
2. Ở góc trên bên phải, nhấn nút **Deploy** (Triển khai) màu xanh.
3. Chọn **New deployment** (Tùy chọn triển khai mới).
4. Nhấn vào biểu tượng bánh răng (Select type) bên cạnh chữ "Select type", chọn **Web app**.

## Bước 3: Cấu hình Quyền (Quan trọng)
Điền các thông tin sau vào bảng hiện ra:
- **Description**: `LMS API v1` (hoặc tên tùy ý).
- **Execute as**: Chọn **Me** (Tôi) - *Script sẽ chạy dưới quyền của bạn*.
- **Who has access**: Chọn **Anyone** (Bất kỳ ai) - *Để web app có thể gọi API mà không cần đăng nhập Google*.

> **Lưu ý:** Nếu bạn chọn "Only myself" hoặc "Anyone with Google account", web app sẽ bị lỗi CORS hoặc 403 Forbidden.

5. Nhấn **Deploy** (Triển khai).

## Bước 4: Lấy URL và Cấu hình Web
1. Sau khi deploy xong, bạn sẽ thấy mục **Web App URL**.
2. Copy toàn bộ URL này (có đuôi `/exec`).
3. Quay lại dự án React, mở file `.env`.
4. Dán URL vào biến `VITE_API_URL`:
   ```env
   VITE_API_URL=https://script.google.com/macros/s/......./exec
   ```
5. Khởi động lại Web App (`npm run dev`) để nhận cấu hình mới.

## Bước 5: Kiểm tra (Test)
Bạn có thể test nhanh xem API có hoạt động không bằng Postman hoặc cURL:

**URL:** `<Web App URL của bạn>`
**Method:** `POST`
**Body (JSON):**
```json
{
  "action": "classes.list",
  "payload": {}
}
```

Nếu trả về kết quả JSON danh sách lớp học (hoặc mảng rỗng `[]` nếu chưa có dữ liệu) và `ok: true`, nghĩa là bạn đã triển khai thành công!
