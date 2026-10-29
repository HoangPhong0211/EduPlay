# EduPlay 🎓

Hệ thống học toán tương tác cho học sinh tiểu học lớp 1–5, hỗ trợ gamification (điểm, huy hiệu), quản lý bài tập từ phụ huynh và ngân hàng câu hỏi cho admin.

---

## Yêu Cầu Cài Đặt

| Công cụ | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0 | Có sẵn khi cài .NET SDK |
| [Node.js](https://nodejs.org) | 18+ | Dùng để chạy Frontend (React + Vite) |
| [SQL Server LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) | 2019/2022 | Đi kèm Visual Studio (Workload ASP.NET / .NET Desktop) |

---

## Hướng Dẫn Chạy Nhanh (Dành cho Giáo viên / Đánh giá dự án)

Hệ thống đã được thiết kế để **tự động tạo Database, chạy Migrations và nạp sẵn dữ liệu mẫu** ngay khi khởi động backend. Không cần cài đặt công cụ hay cấu hình thủ công phức tạp!

### Bước 1 — Chạy Backend (.NET Core)

Mở Terminal tại thư mục dự án:

```powershell
cd BE
dotnet run
```

> **Ghi chú tự động**:
> - Backend sẽ tự động kết nối `(localdb)\MSSQLLocalDB`, tạo database `EduPlayDB`, chạy toàn bộ migrations và khởi tạo sẵn tài khoản mẫu, bài học, câu hỏi.
> - Backend lắng nghe tại: **http://localhost:5271**
> - Swagger UI (API Docs): **http://localhost:5271/swagger**

*(Tùy chọn: Bạn cũng có thể mở solution trong Visual Studio và nhấn **F5** để chạy).*

---

### Bước 2 — Chạy Frontend (React + Vite)

Mở một Terminal mới (khác với terminal backend):

```powershell
cd FE
npm install
npm run dev
```

> Frontend chạy tại: **http://localhost:5173**

---

## Tài Khoản Mẫu Đăng Nhập

Hệ thống đã có sẵn các tài khoản mẫu sau (tất cả đều dùng chung mật khẩu: `Password123@`):

| Vai trò | Tên đăng nhập (Username) | Mật khẩu | Chức năng chính |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `Password123@` | Quản lý khối lớp, bài học, ngân hàng câu hỏi, tạo đề thi, quản lý người dùng |
| **Phụ huynh (Parent)** | `parent1` | `Password123@` | Giao bài cho con, cài giới hạn thời gian học, xem báo cáo & phân tích điểm |
| **Học sinh 1** | `student1` | `Password123@` | Làm bài tập, luyện trắc nghiệm/điền số, nhận huy hiệu (Bé Bo - 120 điểm) |
| **Học sinh 2** | `student2` | `Password123@` | Làm bài tập được phụ huynh giao (Bé Bông - 40 điểm) |

---

## (Tùy Chọn) Cấu Hình Tính Năng Mở Rộng: AI & Gửi Email OTP

> ⚠️ **Lưu ý**: Nếu chỉ chấm bài và trải nghiệm toàn bộ các tính năng cốt lõi (Đăng nhập, Quản lý đề, Học tập, Làm bài, Báo cáo, Gamification), bạn **HOÀN TOÀN KHÔNG CẦN** làm bước này.

Chỉ thực hiện bước này nếu muốn thử nghiệm tính năng **Sinh gợi ý tự động bằng Gemini AI** hoặc **Gửi mã OTP quên mật khẩu qua Gmail**:

1. Tạo file `BE/appsettings.Development.json` từ file mẫu:
   ```powershell
   copy BE\appsettings.Development.json.example BE\appsettings.Development.json
   ```
2. Điền API Key và thông tin Gmail:
   - `ApiKey`: Gemini API Key (tạo miễn phí tại [Google AI Studio](https://aistudio.google.com/)).
   - `SenderEmail` & `SenderPassword`: Gmail và Mật khẩu ứng dụng (App Password) của Gmail.

---

## Cấu Trúc Dự Án

```
EduPlay/
├── BE/                          # ASP.NET Core Backend
│   ├── Controllers/             # API Endpoints (Auth, Admin, Parent, Student, Report...)
│   ├── Services/                # Nghiệp vụ xử lý logic
│   ├── Data/                    # DbContext + DbSeeder (Dữ liệu mẫu chuẩn)
│   ├── Models/                  # Thực thể CSDL (User, Parent, Student, Lesson, Question...)
│   ├── Migrations/              # 8 bản EF Core Migrations
│   ├── appsettings.json         # Cấu hình chuỗi kết nối và JWT
│   └── appsettings.Development.json.example  # Template cấu hình bí mật (tùy chọn)
└── FE/                          # React + Vite Frontend
    ├── src/
    │   ├── admin/               # Quản lý khóa học, câu hỏi, tạo đề, user
    │   ├── parent/              # Bảng điều khiển phụ huynh, giao bài, báo cáo
    │   ├── student/             # Bảng học sinh, làm bài tập, bộ sưu tập huy hiệu
    │   └── auth/                # Đăng nhập, đăng ký, quên mật khẩu
    └── .env                     # VITE_API_URL=http://localhost:5271/api
```
