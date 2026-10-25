# EduPlay 🎓

Hệ thống học toán tương tác cho học sinh tiểu học lớp 1–5, hỗ trợ gamification (điểm, huy hiệu), quản lý bài tập từ phụ huynh và ngân hàng câu hỏi cho admin.

---

## Yêu Cầu Cài Đặt

| Công cụ | Phiên bản tối thiểu |
|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0 |
| [Node.js](https://nodejs.org) | 18+ |
| [SQL Server LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) | Đi kèm Visual Studio hoặc SQL Server Express |
| EF Core CLI | `dotnet tool install --global dotnet-ef` |

---

## Hướng Dẫn Chạy (sau khi `git clone`)

### Bước 1 — Chuẩn bị cấu hình backend (bí mật)

Tạo file `BE/appsettings.Development.json` từ template (file này **không được commit** vì chứa API key):

```bash
copy BE\appsettings.Development.json.example BE\appsettings.Development.json
```

Sau đó mở `BE/appsettings.Development.json` và điền:
- **`ApiKey`**: Gemini API Key của bạn (lấy tại [Google AI Studio](https://aistudio.google.com/))
- **`SenderEmail` / `SenderPassword`**: Gmail + App Password (nếu dùng chức năng gửi OTP)

> Nếu chưa cần tính năng AI và Email, bạn vẫn có thể bỏ qua và chạy được hệ thống — chỉ hai chức năng đó sẽ lỗi.

---

### Bước 2 — Khởi động LocalDB

```powershell
sqllocaldb start MSSQLLocalDB
```

> Nếu báo "not found": cài SQL Server Express LocalDB hoặc Visual Studio với workload ASP.NET.

---

### Bước 3 — Cài đặt và chạy Backend

```powershell
cd BE
dotnet restore
dotnet ef database update
dotnet run
```

Backend chạy tại: **http://localhost:5271**  
Swagger UI: **http://localhost:5271/swagger**

> `dotnet ef database update` tạo database `EduPlayDB` và áp dụng toàn bộ migrations.  
> `dotnet run` sẽ tự seed dữ liệu mẫu lần đầu tiên.

---

### Bước 4 — Cài đặt và chạy Frontend

```powershell
cd FE
npm install
npm run dev
```

Frontend chạy tại: **http://localhost:5173**

---

## Tài Khoản Mẫu (sau khi seed)

| Vai trò | Username | Password |
|---|---|---|
| Admin | `admin` | `Password123@` |
| Phụ huynh | `parent1` | `Password123@` |
| Học sinh 1 | `student1` | `Password123@` |
| Học sinh 2 | `student2` | `Password123@` |

---

## Cấu Trúc Dự Án

```
EduPlay/
├── BE/                          # ASP.NET Core 10 Backend
│   ├── Controllers/             # API endpoints
│   ├── Services/                # Business logic
│   ├── Data/                    # DbContext + DbSeeder
│   ├── Models/                  # Entity models
│   ├── Migrations/              # EF Core migrations (7 migrations)
│   ├── appsettings.json         # Cấu hình chung (committed)
│   └── appsettings.Development.json.example  # Template cấu hình bí mật
└── FE/                          # React + Vite Frontend
    ├── src/
    │   ├── admin/               # Giao diện Admin
    │   ├── parent/              # Giao diện Phụ huynh
    │   └── student/             # Giao diện Học sinh
    └── .env                     # VITE_API_URL (mặc định: http://localhost:5271/api)
```

---

## Lưu Ý

- `BE/appsettings.Development.json` bị gitignore — **không bao giờ commit file này**.
- Nếu đổi port backend, cập nhật `FE/.env` → `VITE_API_URL=http://localhost:<port>/api`.
- Để xem log migration lỗi chi tiết: `dotnet ef database update --verbose`.
