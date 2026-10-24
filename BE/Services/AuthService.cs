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
using Microsoft.Extensions.Logging;
using System.Data.Common;
using System.Net;
using System.Net.Mail;

namespace BE.Services
{
    public class AuthService
    {
        private readonly EduPlayDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;

        public AuthService(EduPlayDbContext context, IConfiguration config, ILogger<AuthService> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterDto dto)
        {
            if (dto.Role != UserRole.Parent)
            {
                return new AuthResponse
                {
                    IsSuccess = false,
                    Message = "Chỉ được phép đăng ký tài khoản Phụ huynh. Tài khoản học sinh do phụ huynh tạo; quyền Admin do quản trị viên cấp."
                };
            }

            try
            {
                if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                {
                    return new AuthResponse { IsSuccess = false, Message = "Tài khoản đã tồn tại!" };
                }

                string trimmedEmail = dto.Email?.Trim() ?? string.Empty;
                if (!string.IsNullOrEmpty(trimmedEmail) && await _context.Parents.AnyAsync(p => p.Email == trimmedEmail))
                {
                    return new AuthResponse { IsSuccess = false, Message = "Địa chỉ email này đã được đăng ký bởi một tài khoản khác!" };
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();
                var user = new User
                {
                    Username = dto.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password), // Mã hóa 1 chiều
                    Role = UserRole.Parent.ToString()
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync(); // Lưu để EF Core sinh ra user.Id

                _context.Parents.Add(new Parent
                {
                    UserId = user.Id,
                    Email = trimmedEmail,
                    PhoneNumber = string.Empty
                });
                await _context.SaveChangesAsync(); // Lưu bảng Parent

                await transaction.CommitAsync(); // Xác nhận Transaction thành công
                return new AuthResponse { IsSuccess = true, Message = "Đăng ký thành công!" };
            }
            catch (Exception ex) when (ex is DbException or DbUpdateException)
            {
                _logger.LogError(ex, "Database error while registering user {Username}", dto.Username);
                throw new AuthenticationDatabaseException(ex);
            }
        }

        public async Task<AuthResponse> LoginAsync(LoginDto dto)
        {
            User? user;
            try
            {
                user = await _context.Users.SingleOrDefaultAsync(u => u.Username == dto.Username);
            }
            catch (Exception ex) when (ex is DbException or DbUpdateException)
            {
                _logger.LogError(ex, "Database error while logging in user {Username}", dto.Username);
                throw new AuthenticationDatabaseException(ex);
            }

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

            // Xác định email người nhận (Ưu tiên Email trong bảng Parents)
            string recipientEmail = "";
            var parent = await _context.Parents.SingleOrDefaultAsync(p => p.UserId == user.Id);
            if (parent != null && !string.IsNullOrEmpty(parent.Email))
            {
                recipientEmail = parent.Email;
            }
            else
            {
                // Nếu là học sinh, lấy email của phụ huynh quản lý
                var student = await _context.Students.SingleOrDefaultAsync(s => s.UserId == user.Id);
                if (student != null)
                {
                    var studentParent = await _context.Parents.SingleOrDefaultAsync(p => p.UserId == student.ParentId);
                    if (studentParent != null && !string.IsNullOrEmpty(studentParent.Email))
                    {
                        recipientEmail = studentParent.Email;
                    }
                }
            }

            // Môi trường cá nhân / Demo: Tự động gán email mặc định nếu tài khoản chưa nhập email
            if (string.IsNullOrEmpty(recipientEmail))
            {
                recipientEmail = $"{user.Username.ToLower()}@gmail.com";
            }

            // Sinh mã OTP 6 số an toàn
            string otp = Random.Shared.Next(100000, 999999).ToString();
            user.OtpCode = otp;
            user.OtpExpiryTime = DateTime.UtcNow.AddMinutes(5);
            await _context.SaveChangesAsync();

            string emailSubject = "[EduPlay] Mã OTP khôi phục mật khẩu";
            string emailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                    <h2 style='color: #00838f; text-align: center;'>Khôi phục mật khẩu EduPlay</h2>
                    <p>Xin chào <strong>{user.Username}</strong>,</p>
                    <p>Bạn (hoặc phụ huynh) vừa gửi yêu cầu khôi phục mật khẩu tài khoản EduPlay. Dưới đây là mã xác thực OTP của bạn:</p>
                    <div style='text-align: center; margin: 24px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #00838f; background: #e0f7fa; padding: 12px 28px; border-radius: 8px; display: inline-block;'>{otp}</span>
                    </div>
                    <p style='color: #ef4444; font-size: 13px;'>* Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' />
                    <p style='font-size: 12px; color: #64748b; text-align: center;'>Đội ngũ hỗ trợ EduPlay - Nền tảng học toán thông minh cho học sinh tiểu học</p>
                </div>";

            // Thử gửi Email thật qua SMTP nếu cấu hình đã sẵn sàng
            bool isRealEmailSent = await TrySendEmailAsync(recipientEmail, emailSubject, emailBody);

            if (isRealEmailSent)
            {
                _logger.LogInformation("Đã gửi email OTP thật thành công tới: {Email}", recipientEmail);
                return new BaseResponse
                {
                    IsSuccess = true,
                    Message = $"Mã OTP đã được gửi đến email {recipientEmail}. Vui lòng kiểm tra hộp thư!"
                };
            }

            // FALLBACK CHẾ ĐỘ MÔ PHỎNG: In ra Console terminal khi chưa cấu hình SMTP thật
            Console.WriteLine($"\n========================================");
            Console.WriteLine($"[CHẾ ĐỘ MÔ PHỎNG EMAIL] Người nhận: {recipientEmail}");
            Console.WriteLine($"[CHẾ ĐỘ MÔ PHỎNG EMAIL] Tiêu đề: {emailSubject}");
            Console.WriteLine($"[CHẾ ĐỘ MÔ PHỎNG EMAIL] Mã OTP khôi phục mật khẩu là: {otp}");
            Console.WriteLine($"[CHẾ ĐỘ MÔ PHỎNG EMAIL] Thời gian gửi: {DateTime.Now:dd/MM/yyyy HH:mm:ss}");
            Console.WriteLine($"[CHẾ ĐỘ MÔ PHỎNG EMAIL] (Để gửi email thật: điền SenderEmail & SenderPassword trong appsettings.json)");
            Console.WriteLine($"========================================\n");

            // Trả thông tin email và mã OTP về Frontend để hỗ trợ trải nghiệm kiểm thử
            return new BaseResponse
            {
                IsSuccess = true,
                Message = $"[MÔ PHỎNG EMAIL] Người nhận: {recipientEmail} | Mã OTP: {otp}"
            };
        }

        private async Task<bool> TrySendEmailAsync(string toEmail, string subject, string bodyHtml)
        {
            try
            {
                var smtpHost = _config["EmailSettings:SmtpHost"];
                var smtpPortStr = _config["EmailSettings:SmtpPort"];
                var senderEmail = _config["EmailSettings:SenderEmail"];
                var senderPassword = _config["EmailSettings:SenderPassword"];
                var displayName = _config["EmailSettings:SenderDisplayName"] ?? "EduPlay Hỗ Trợ";

                if (string.IsNullOrWhiteSpace(smtpHost) ||
                    string.IsNullOrWhiteSpace(senderEmail) ||
                    string.IsNullOrWhiteSpace(senderPassword))
                {
                    // Chưa cấu hình tài khoản SMTP thật
                    return false;
                }

                int port = int.TryParse(smtpPortStr, out int p) ? p : 587;
                bool enableSsl = bool.TryParse(_config["EmailSettings:EnableSsl"], out bool ssl) ? ssl : true;

                using var client = new SmtpClient(smtpHost, port)
                {
                    Credentials = new NetworkCredential(senderEmail, senderPassword),
                    EnableSsl = enableSsl
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, displayName),
                    Subject = subject,
                    Body = bodyHtml,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);
                await client.SendMailAsync(mailMessage);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không thể gửi email thật qua SMTP tới {Email}. Tự động fallback về Console.", toEmail);
                return false;
            }
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

    public sealed class AuthenticationDatabaseException : Exception
    {
        public AuthenticationDatabaseException(Exception innerException)
            : base("Authentication failed because the database is unavailable.", innerException)
        {
        }
    }
}