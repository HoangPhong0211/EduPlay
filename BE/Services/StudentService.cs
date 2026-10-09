using BE.Data;
using BE.Models;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BE.Services
{
    public class StudentService
    {
        private readonly EduPlayDbContext _context;
        private readonly ILogger<StudentService> _logger;

        public StudentService(EduPlayDbContext context, ILogger<StudentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<BaseResponse> SubmitAnswerAsync(int userId, SubmitAnswerDto dto)
        {
            try
            {
                var student = await _context.Students.SingleOrDefaultAsync(s => s.UserId == userId);
                if (student == null)
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy hồ sơ học sinh!" };

                var question = await _context.Questions.FirstOrDefaultAsync(q => q.Id == dto.QuestionId);
                if (question == null)
                    return new BaseResponse { IsSuccess = false, Message = "Câu hỏi không tồn tại!" };

                bool isCorrect = question.CorrectAnswer == dto.SubmittedAnswer;

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var errorLog = new ErrorLog
                    {
                        StudentId = student.UserId,
                        QuestionId = dto.QuestionId,
                        SubmittedAnswer = dto.SubmittedAnswer,
                        IsCorrect = isCorrect,
                        AttemptTime = DateTime.UtcNow
                    };
                    _context.ErrorLogs.Add(errorLog);

                    if (isCorrect)
                    {
                        // Hệ thống điểm thưởng dựa trên độ khó
                        int points = question.DifficultyLevel switch
                        {
                            "Dễ" => 5,
                            "Trung bình" => 10,
                            "Khó" => 20,
                            _ => 10
                        };
                        student.TotalPoints += points;
                    }

                    var earnedBadges = await CheckAndAwardBadgesAsync(student.UserId, student.TotalPoints);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    int earnedPoints = question.DifficultyLevel switch
                    {
                        "Dễ" => 5,
                        "Trung bình" => 10,
                        "Khó" => 20,
                        _ => 10
                    };

                    string badgeMessage = earnedBadges.Any() ? $" Chúc mừng! Bạn vừa nhận huy hiệu: {string.Join(", ", earnedBadges)}" : "";

                    return new BaseResponse
                    {
                        IsSuccess = true,
                        Message = isCorrect
                            ? $"Chính xác! Bạn được cộng {earnedPoints} điểm.{badgeMessage}"
                            : $"Sai rồi! Gợi ý cho bạn: {question.Hint}"
                    };
                }
                catch (Exception) // Bỏ biến ex đi để hết cảnh báo CS0168
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi nộp bài cho UserId: {UserId}", userId);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi chấm điểm." };
            }
        }

        private async Task<List<string>> CheckAndAwardBadgesAsync(int studentId, int currentPoints)
        {
            var newBadgesEarned = new List<string>();

            // 1. Lấy tất cả các huy hiệu trong hệ thống (Giả sử Admin đã tạo sẵn trong bảng BADGES)
            var allBadges = await _context.Badges.ToListAsync();

            // 2. Lấy danh sách ID huy hiệu học sinh đã sở hữu
            var earnedBadgeIds = await _context.StudentBadges
                .Where(sb => sb.StudentId == studentId)
                .Select(sb => sb.BadgeId)
                .ToListAsync();

            // 3. Logic xét duyệt: Giả định cứng tên huy hiệu (CHÚ Ý: Admin phải tạo badge với tên chính xác)
            foreach (var badge in allBadges)
            {
                if (!earnedBadgeIds.Contains(badge.Id))
                {
                    bool isQualified = (badge.Name == "Chăm chỉ" && currentPoints >= 50) ||
                                       (badge.Name == "Thông minh" && currentPoints >= 100);

                    if (isQualified)
                    {
                        _context.StudentBadges.Add(new StudentBadge
                        {
                            StudentId = studentId,
                            BadgeId = badge.Id,
                            EarnedAt = DateTime.UtcNow
                        });
                        newBadgesEarned.Add(badge.Name);
                    }
                }
            }

            return newBadgesEarned;
        }

        public async Task<object> GetStudentDashboardAsync(int userId)
        {
            var student = await _context.Students
                .Include(s => s.StudentBadges) // Yêu cầu bạn đã cấu hình Navigation Property
                .ThenInclude(sb => sb.Badge)
                .SingleOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
                return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy hồ sơ!" };

            // Nếu chưa dùng Include, bạn có thể Query thủ công bằng LINQ như các bước trước
            var badges = await _context.StudentBadges
                .Where(sb => sb.StudentId == student.UserId)
                .Join(_context.Badges, sb => sb.BadgeId, b => b.Id, (sb, b) => b.Name)
                .ToListAsync();

            var dashboardData = new StudentDashboardDto
            {
                Nickname = student.Nickname,
                TotalPoints = student.TotalPoints,
                TimeLimitMinutes = student.TimeLimitMinutes,
                EarnedBadges = badges
            };

            return new { IsSuccess = true, Data = dashboardData };
        }

        // Lấy lộ trình theo khối lớp
        public async Task<object> GetRoadmapAsync(int gradeLevel)
        {
            var roadmap = await _context.Topics
                .Where(t => t.GradeLevel == gradeLevel)
                .Include(t => t.Lessons)
                .OrderBy(t => t.Id)
                .Select(t => new
                {
                    TopicId = t.Id,
                    TopicName = t.Name,
                    Description = t.Description,
                    Lessons = t.Lessons
                        .OrderBy(l => l.OrderIndex)
                        .Select(l => new
                        {
                            LessonId = l.Id,
                            Title = l.Title,
                            OrderIndex = l.OrderIndex
                        })
                        .ToList()
                })
                .ToListAsync();

            return new { IsSuccess = true, TotalTopics = roadmap.Count, Data = roadmap };
        }

        // Lấy danh sách câu hỏi để học sinh luyện tập cho 1 bài học
        public async Task<object> GetLessonQuestionsAsync(int lessonId)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Topic)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null)
                return new { IsSuccess = false, Message = "Không tìm thấy bài học!" };

            var questions = await _context.Questions
                .Where(q => q.LessonId == lessonId)
                .Select(q => new
                {
                    q.Id,
                    q.LessonId,
                    q.Content,
                    q.QuestionType,
                    q.DifficultyLevel,
                    q.OptionA,
                    q.OptionB,
                    q.OptionC,
                    q.OptionD
                })
                .ToListAsync();

            return new
            {
                IsSuccess = true,
                Lesson = new
                {
                    lesson.Id,
                    lesson.Title,
                    TopicName = lesson.Topic != null ? lesson.Topic.Name : "",
                    GradeLevel = lesson.Topic != null ? lesson.Topic.GradeLevel : 1
                },
                TotalQuestions = questions.Count,
                Data = questions
            };
        }

        // Lấy danh sách bài tập được phụ huynh giao cho học sinh
        public async Task<object> GetMyAssignmentsAsync(int userId)
        {
            var student = await _context.Students.SingleOrDefaultAsync(s => s.UserId == userId);
            if (student == null)
                return new { IsSuccess = false, Message = "Không tìm thấy hồ sơ học sinh!" };

            var assignments = await _context.Assignments
                .Where(a => a.StudentId == student.UserId)
                .Join(_context.Lessons, a => a.LessonId, l => l.Id, (a, l) => new
                {
                    a.Id,
                    a.LessonId,
                    LessonTitle = l.Title,
                    a.Status,
                    a.DueDate
                })
                .OrderByDescending(a => a.Id)
                .ToListAsync();

            return new { IsSuccess = true, Data = assignments };
        }
    }
}