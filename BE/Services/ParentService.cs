using BE.Data;
using BE.Models;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BE.Services
{
    public class ParentService
    {
        private readonly EduPlayDbContext _context;
        private readonly ILogger<ParentService> _logger; // Bổ sung ILogger

        // Tiêm ILogger vào constructor
        public ParentService(EduPlayDbContext context, ILogger<ParentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<BaseResponse> CreateStudentAccountAsync(int parentId, CreateStudentDto dto)
        {
            try
            {
                // 1. Kiểm tra ParentId có tồn tại không
                if (!await _context.Parents.AnyAsync(p => p.UserId == parentId))
                    return new BaseResponse { IsSuccess = false, Message = "Tài khoản phụ huynh không tồn tại!" };

                // 2. Kiểm tra Username trùng lặp
                if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                    return new BaseResponse { IsSuccess = false, Message = "Tên đăng nhập đã tồn tại!" };

                using var transaction = await _context.Database.BeginTransactionAsync();

                // 3. Tạo User cho Học sinh
                var user = new User
                {
                    Username = dto.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    Role = UserRole.Student.ToString()
                };
                _context.Users.Add(user);

                // Lưu lần 1 để lấy Id (xem giải thích bên dưới)
                await _context.SaveChangesAsync();

                // 4. Tạo hồ sơ Student và gắn ParentId
                var student = new Student
                {
                    UserId = user.Id,
                    ParentId = parentId,
                    Nickname = dto.Nickname
                };
                _context.Students.Add(student);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new BaseResponse { IsSuccess = true, Message = "Tạo tài khoản cho con thành công!" };
            }
            catch (Exception ex)
            {
                // Ghi lại lỗi chi tiết vào hệ thống
                _logger.LogError(ex, "Lỗi khi tạo tài khoản học sinh cho ParentId: {ParentId}", parentId);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi tạo hồ sơ." };
            }
        }

        // Thêm vào bên trong class ParentService
        public async Task<BaseResponse> SetTimeLimitAsync(int parentId, SetTimeLimitDto dto)
        {
            var student = await _context.Students
                .SingleOrDefaultAsync(s => s.UserId == dto.StudentId && s.ParentId == parentId);

            if (student == null)
                return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy hồ sơ học sinh hoặc bạn không có quyền truy cập." };

            student.TimeLimitMinutes = dto.TimeLimitMinutes;
            await _context.SaveChangesAsync();

            return new BaseResponse { IsSuccess = true, Message = $"Đã giới hạn thời gian học thành {dto.TimeLimitMinutes} phút." };
        }

        public async Task<BaseResponse> AssignTaskAsync(int parentId, CreateAssignmentDto dto)
        {
            var student = await _context.Students
                .SingleOrDefaultAsync(s => s.UserId == dto.StudentId && s.ParentId == parentId);

            if (student == null)
                return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy hồ sơ học sinh." };

            if (!await _context.Lessons.AnyAsync(l => l.Id == dto.LessonId))
                return new BaseResponse { IsSuccess = false, Message = "Bài học không tồn tại." };

            var assignment = new Assignment
            {
                ParentId = parentId,
                StudentId = dto.StudentId,
                LessonId = dto.LessonId,
                DueDate = dto.DueDate,
                Status = "Assigned"
            };

            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            return new BaseResponse { IsSuccess = true, Message = "Giao nhiệm vụ thành công!" };
        }
    }
}