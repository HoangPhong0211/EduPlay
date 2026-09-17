using BE.Data;
using BE.Models;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace BE.Services
{
    public class AuthService
    {
        private readonly EduPlayDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(EduPlayDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterDto dto)
        {
            // Kiểm tra Role: Chặn không cho gọi API đăng ký tự do với Role Student
            // Học sinh phải do Phụ huynh tạo hồ sơ
            if (dto.Role == UserRole.Student)
            {
                return new AuthResponse { IsSuccess = false, Message = "Tài khoản Học sinh phải do Phụ huynh tạo!" };
            }

            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            {
                return new AuthResponse { IsSuccess = false, Message = "Tài khoản đã tồn tại!" };
            }

            // Mở Transaction để đảm bảo tính toàn vẹn dữ liệu
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = new User
                {
                    Username = dto.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password), // Mã hóa 1 chiều
                    Role = dto.Role.Value.ToString()
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync(); // Lưu để EF Core sinh ra user.Id

                if (dto.Role == UserRole.Parent)
                {
                    _context.Parents.Add(new Parent { UserId = user.Id });
                    await _context.SaveChangesAsync(); // Lưu bảng Parent
                }

                await transaction.CommitAsync(); // Xác nhận Transaction thành công
                return new AuthResponse { IsSuccess = true, Message = "Đăng ký thành công!" };
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(); // Hoàn tác nếu có lỗi
                return new AuthResponse { IsSuccess = false, Message = "Có lỗi xảy ra trong quá trình lưu dữ liệu." };
            }
        }

        public async Task<AuthResponse> LoginAsync(LoginDto dto)
        {
            // 1. Tìm User
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return new AuthResponse { IsSuccess = false, Message = "Tài khoản hoặc mật khẩu không đúng!" };
            }

            // 2. Tạo thông tin (Claims) để nhúng vào Token
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            if (!user.IsActive)
            {
                return new AuthResponse { IsSuccess = false, Message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!" };
            }

            // 3. Ký và tạo Token
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"]!,
                audience: _config["Jwt:Audience"]!,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7), // Token sống 7 ngày
                signingCredentials: creds
            );

            return new AuthResponse
            {
                IsSuccess = true,
                Message = "Đăng nhập thành công!",
                Token = new JwtSecurityTokenHandler().WriteToken(token)
            };
        }

        public async Task<BaseResponse> GenerateAndSendOtpAsync(ForgotPasswordDto dto)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null) return new BaseResponse { IsSuccess = false, Message = "Tài khoản không tồn tại." };

            var parent = await _context.Parents.SingleOrDefaultAsync(p => p.UserId == user.Id);
            if (parent == null || string.IsNullOrEmpty(parent.Email))
                return new BaseResponse { IsSuccess = false, Message = "Tài khoản này chưa được liên kết Email." };

            // Sinh mã OTP 6 số an toàn hơn
            string otp = Random.Shared.Next(100000, 999999).ToString();
            user.OtpCode = otp;
            user.OtpExpiryTime = DateTime.UtcNow.AddMinutes(5);
            await _context.SaveChangesAsync();

            // GIẢ LẬP GỬI EMAIL: In ra cửa sổ Terminal/Console để dễ kiểm tra
            Console.WriteLine($"\n========================================");
            Console.WriteLine($"[GIẢ LẬP EMAIL] Người nhận: {parent.Email}");
            Console.WriteLine($"[GIẢ LẬP EMAIL] Mã OTP khôi phục mật khẩu là: {otp}");
            Console.WriteLine($"========================================\n");

            // Trả mã OTP về thẳng Frontend thông qua Message để tiện test và demo đồ án
            return new BaseResponse
            {
                IsSuccess = true,
                Message = $"[Chế độ Demo] Đã tạo mã OTP thành công. Mã OTP của bạn là: {otp}"
            };
        }

        public async Task<BaseResponse> ResetPasswordWithOtpAsync(ResetPasswordDto dto)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null) return new BaseResponse { IsSuccess = false, Message = "Tài khoản không tồn tại." };

            if (string.IsNullOrEmpty(user.OtpCode) || user.OtpCode != dto.OtpCode)
                return new BaseResponse { IsSuccess = false, Message = "Mã OTP không hợp lệ." };

            if (user.OtpExpiryTime == null || user.OtpExpiryTime < DateTime.UtcNow)
                return new BaseResponse { IsSuccess = false, Message = "Mã OTP đã hết hạn." };

            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
                return new BaseResponse { IsSuccess = false, Message = "Mật khẩu mới phải có ít nhất 8 ký tự." };

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.OtpCode = null;
            user.OtpExpiryTime = null;
            await _context.SaveChangesAsync();

            return new BaseResponse { IsSuccess = true, Message = "Khôi phục mật khẩu thành công!" };
        }
    }
}