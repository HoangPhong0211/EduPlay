using BE.Data;
using BE.Models;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BE.Services
{
    public class AdminService
    {
        private readonly EduPlayDbContext _context;
        private readonly ILogger<AdminService> _logger;

        public AdminService(EduPlayDbContext context, ILogger<AdminService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Tính năng 1: Thêm câu hỏi
        public async Task<BaseResponse> CreateQuestionAsync(CreateQuestionDto dto)
        {
            try
            {
                // Kiểm tra Content rỗng (Double check an toàn)
                if (string.IsNullOrWhiteSpace(dto.Content))
                    return new BaseResponse { IsSuccess = false, Message = "Nội dung câu hỏi không được để trống!" };

                // Kiểm tra LessonId có tồn tại không
                if (!await _context.Lessons.AnyAsync(l => l.Id == dto.LessonId))
                    return new BaseResponse { IsSuccess = false, Message = "Bài học (Lesson) này không tồn tại!" };

                // Kiểm tra QuestionType hợp lệ
                var validTypes = new List<string> { "Kéo thả", "Trắc nghiệm" };
                if (!validTypes.Contains(dto.QuestionType))
                    return new BaseResponse { IsSuccess = false, Message = "Loại câu hỏi chỉ được là 'Kéo thả' hoặc 'Trắc nghiệm'." };

                // Kiểm tra DifficultyLevel hợp lệ
                var validDifficulties = new List<string> { "Dễ", "Trung bình", "Khó" };
                if (!validDifficulties.Contains(dto.DifficultyLevel))
                    return new BaseResponse { IsSuccess = false, Message = "Độ khó chỉ được là 'Dễ', 'Trung bình' hoặc 'Khó'." };

                var question = new Question
                {
                    LessonId = dto.LessonId,
                    Content = dto.Content,
                    QuestionType = dto.QuestionType,
                    DifficultyLevel = dto.DifficultyLevel,
                    CorrectAnswer = dto.CorrectAnswer,
                    Hint = dto.Hint
                };

                _context.Questions.Add(question);
                await _context.SaveChangesAsync();

                return new BaseResponse { IsSuccess = true, Message = "Thêm câu hỏi thành công!" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi thêm câu hỏi mới cho LessonId: {LessonId}", dto.LessonId);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi thêm câu hỏi." };
            }
        }

        // Tính năng: Lấy danh sách câu hỏi (có thể lọc theo LessonId)
        public async Task<object> GetAllQuestionsAsync(int? lessonId)
        {
            var query = _context.Questions.AsQueryable();

            if (lessonId.HasValue)
                query = query.Where(q => q.LessonId == lessonId.Value);

            var questions = await query.ToListAsync();
            return new { IsSuccess = true, Total = questions.Count, Data = questions };
        }

        // Tính năng: Sửa câu hỏi
        public async Task<BaseResponse> UpdateQuestionAsync(int id, CreateQuestionDto dto)
        {
            try
            {
                var question = await _context.Questions.FindAsync(id);
                if (question == null)
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy câu hỏi!" };

                if (string.IsNullOrWhiteSpace(dto.Content))
                    return new BaseResponse { IsSuccess = false, Message = "Nội dung câu hỏi không được để trống!" };

                if (!await _context.Lessons.AnyAsync(l => l.Id == dto.LessonId))
                    return new BaseResponse { IsSuccess = false, Message = "Bài học không tồn tại!" };

                var validTypes = new List<string> { "Kéo thả", "Trắc nghiệm" };
                if (!validTypes.Contains(dto.QuestionType))
                    return new BaseResponse { IsSuccess = false, Message = "Loại câu hỏi chỉ được là 'Kéo thả' hoặc 'Trắc nghiệm'." };

                var validDifficulties = new List<string> { "Dễ", "Trung bình", "Khó" };
                if (!validDifficulties.Contains(dto.DifficultyLevel))
                    return new BaseResponse { IsSuccess = false, Message = "Độ khó chỉ được là 'Dễ', 'Trung bình' hoặc 'Khó'." };

                question.LessonId = dto.LessonId;
                question.Content = dto.Content;
                question.QuestionType = dto.QuestionType;
                question.DifficultyLevel = dto.DifficultyLevel;
                question.CorrectAnswer = dto.CorrectAnswer;
                if (dto.Hint != null) question.Hint = dto.Hint;

                await _context.SaveChangesAsync();
                return new BaseResponse { IsSuccess = true, Message = "Cập nhật câu hỏi thành công!" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật câu hỏi QuestionId: {QuestionId}", id);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi cập nhật câu hỏi." };
            }
        }

        // Tính năng: Xóa câu hỏi
        public async Task<BaseResponse> DeleteQuestionAsync(int id)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null)
                return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy câu hỏi!" };

            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();
            return new BaseResponse { IsSuccess = true, Message = "Đã xóa câu hỏi." };
        }

        // Tính năng 2: Sinh đề tự động
        public async Task<object> GenerateAutoTestAsync(GenerateTestDto dto)
        {
            try
            {
                var allQuestions = await _context.Questions
                    .Where(q => q.LessonId == dto.LessonId)
                    .ToListAsync();

                var easyQuestions = allQuestions
                    .Where(q => q.DifficultyLevel == "Dễ")
                    .OrderBy(_ => Random.Shared.Next())
                    .Take(dto.EasyCount)
                    .ToList();

                var mediumQuestions = allQuestions
                    .Where(q => q.DifficultyLevel == "Trung bình")
                    .OrderBy(_ => Random.Shared.Next())
                    .Take(dto.MediumCount)
                    .ToList();

                var hardQuestions = allQuestions
                    .Where(q => q.DifficultyLevel == "Khó")
                    .OrderBy(_ => Random.Shared.Next())
                    .Take(dto.HardCount)
                    .ToList();

                // Kiểm tra chặt chẽ số lượng câu hỏi lấy ra so với yêu cầu
                if (easyQuestions.Count < dto.EasyCount ||
                    mediumQuestions.Count < dto.MediumCount ||
                    hardQuestions.Count < dto.HardCount)
                {
                    return new { IsSuccess = false, Message = "Ngân hàng không đủ số lượng câu hỏi theo cấu trúc độ khó yêu cầu!" };
                }

                var finalTest = easyQuestions
                    .Concat(mediumQuestions)
                    .Concat(hardQuestions)
                    .OrderBy(_ => Random.Shared.Next())
                    .Select(q => new
                    {
                        q.Id,
                        q.Content,
                        q.QuestionType,
                        q.DifficultyLevel
                    })
                    .ToList();

                return new { IsSuccess = true, Total = finalTest.Count, Data = finalTest };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi sinh đề tự động cho LessonId: {LessonId}", dto.LessonId);
                return new { IsSuccess = false, Message = "Lỗi hệ thống khi sinh đề." };
            }
        }

        // Tính năng 3: Lấy danh sách toàn bộ người dùng
        public async Task<object> GetAllUsersAsync()
        {
            try
            {
                var users = await _context.Users.ToListAsync();
                var students = await _context.Students.ToListAsync();

                var userDtos = users.Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Role = u.Role,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    StudentNicknames = students
                        .Where(s => s.ParentId == u.Id)
                        .Select(s => s.Nickname)
                        .ToList()
                }).ToList();

                return new { IsSuccess = true, Total = userDtos.Count, Data = userDtos };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách người dùng.");
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi tải dữ liệu." };
            }
        }

        // Tính năng 4: Khóa / Mở khóa tài khoản
        public async Task<BaseResponse> ToggleUserStatusAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy người dùng!" };

                // Bảo vệ: Tránh việc Admin tự khóa chính mình hoặc khóa Admin khác
                if (user.Role == "Admin")
                    return new BaseResponse { IsSuccess = false, Message = "Không thể khóa tài khoản Quản trị viên!" };

                // Đảo ngược trạng thái hiện tại
                user.IsActive = !user.IsActive;
                await _context.SaveChangesAsync();

                string action = user.IsActive ? "Mở khóa" : "Khóa";
                return new BaseResponse { IsSuccess = true, Message = $"{action} tài khoản thành công!" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi thay đổi trạng thái tài khoản UserId: {UserId}", userId);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi cập nhật trạng thái." };
            }
        }
    }
}