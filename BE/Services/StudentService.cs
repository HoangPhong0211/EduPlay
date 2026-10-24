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

                // Kiểm tra giới hạn thời gian học tập trong ngày của phụ huynh
                if (student.TimeLimitMinutes == 0)
                {
                    return new BaseResponse
                    {
                        IsSuccess = false,
                        Message = "Bố mẹ đã thiết lập giới hạn giờ học hôm nay là 0 phút. Bạn hãy liên hệ bố mẹ nếu muốn luyện tập nhé!"
                    };
                }

                var todayLogs = await _context.ErrorLogs
                    .Where(e => e.StudentId == student.UserId && e.AttemptTime.Date == DateTime.UtcNow.Date)
                    .OrderBy(e => e.AttemptTime)
                    .ToListAsync();

                if (todayLogs.Any() && student.TimeLimitMinutes > 0)
                {
                    // Tính tổng thời gian học thực tế tích lũy trong ngày dựa trên các phiên thao tác
                    double activeStudyMinutes = 0;
                    DateTime? prevAttempt = null;
                    foreach (var log in todayLogs)
                    {
                        if (prevAttempt == null)
                        {
                            activeStudyMinutes += 1.0; // Lượt đầu tiên tính 1 phút
                        }
                        else
                        {
                            var diff = (log.AttemptTime - prevAttempt.Value).TotalMinutes;
                            if (diff <= 5.0 && diff > 0)
                            {
                                activeStudyMinutes += diff; // Làm liên tục trong 5 phút
                            }
                            else
                            {
                                activeStudyMinutes += 1.0; // Ngắt quãng quá 5 phút tính phiên mới 1 phút
                            }
                        }
                        prevAttempt = log.AttemptTime;
                    }

                    if (activeStudyMinutes >= student.TimeLimitMinutes)
                    {
                        return new BaseResponse
                        {
                            IsSuccess = false,
                            Message = $"Bạn đã học tích lũy khoảng {Math.Round(activeStudyMinutes)} phút hôm nay và đạt đến giới hạn giờ học ({student.TimeLimitMinutes} phút) do phụ huynh quy định. Hãy nghỉ ngơi để bảo vệ mắt và sức khỏe nhé!"
                        };
                    }
                }

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

            // 1. Tự động kiểm tra và khởi tạo 4 huy hiệu chuẩn nếu chưa có trong CSDL
            var defaultBadges = new[]
            {
                new { Name = "Chăm chỉ", Description = "Đạt 50 điểm tích lũy học tập" },
                new { Name = "Thông minh", Description = "Đạt 100 điểm tích lũy học tập" },
                new { Name = "Chiến binh Toán học", Description = "Đạt 200 điểm tích lũy học tập" },
                new { Name = "Bậc thầy Khám phá", Description = "Đạt 300 điểm tích lũy học tập" }
            };

            foreach (var b in defaultBadges)
            {
                if (!await _context.Badges.AnyAsync(x => x.Name == b.Name))
                {
                    _context.Badges.Add(new Badge { Name = b.Name, Description = b.Description });
                    await _context.SaveChangesAsync();
                }
            }

            // 2. Lấy tất cả các huy hiệu trong hệ thống
            var allBadges = await _context.Badges.ToListAsync();

            // 3. Lấy danh sách ID huy hiệu học sinh đã sở hữu
            var earnedBadgeIds = await _context.StudentBadges
                .Where(sb => sb.StudentId == studentId)
                .Select(sb => sb.BadgeId)
                .ToListAsync();

            // 4. Logic xét duyệt theo 4 mốc: 50, 100, 200, 300 điểm
            foreach (var badge in allBadges)
            {
                if (!earnedBadgeIds.Contains(badge.Id))
                {
                    bool isQualified = (badge.Name == "Chăm chỉ" && currentPoints >= 50) ||
                                       (badge.Name == "Thông minh" && currentPoints >= 100) ||
                                       (badge.Name == "Chiến binh Toán học" && currentPoints >= 200) ||
                                       (badge.Name == "Bậc thầy Khám phá" && currentPoints >= 300);

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

        // Lấy danh sách câu hỏi cho 1 nhiệm vụ bài tập cụ thể (hỗ trợ đề thi ngẫu nhiên Admin phát hành)
        public async Task<object> GetAssignmentQuestionsAsync(int assignmentId, int userId)
        {
            var student = await _context.Students.SingleOrDefaultAsync(s => s.UserId == userId);
            if (student == null)
                return new { IsSuccess = false, Message = "Không tìm thấy hồ sơ học sinh!" };

            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId && a.StudentId == student.UserId);

            if (assignment == null)
                return new { IsSuccess = false, Message = "Không tìm thấy bài tập được giao!" };

            var lesson = await _context.Lessons
                .Include(l => l.Topic)
                .FirstOrDefaultAsync(l => l.Id == assignment.LessonId);

            if (lesson == null)
                return new { IsSuccess = false, Message = "Bài học không tồn tại!" };

            List<int> targetIds = new List<int>();
            if (!string.IsNullOrWhiteSpace(assignment.QuestionIds))
            {
                targetIds = assignment.QuestionIds
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(s => int.TryParse(s, out int id) ? id : 0)
                    .Where(id => id > 0)
                    .ToList();
            }

            IQueryable<Question> query = _context.Questions.Where(q => q.LessonId == assignment.LessonId);

            if (targetIds.Any())
            {
                query = query.Where(q => targetIds.Contains(q.Id));
            }

            var questions = await query
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

            if (targetIds.Any())
            {
                questions = questions
                    .OrderBy(q => targetIds.IndexOf(q.Id))
                    .ToList();
            }

            return new
            {
                IsSuccess = true,
                AssignmentId = assignment.Id,
                AssignmentStatus = assignment.Status,
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

        // Đánh dấu hoàn thành bài tập khi học sinh làm xong toàn bộ câu hỏi
        public async Task<BaseResponse> CompleteAssignmentAsync(int assignmentId, int userId)
        {
            var student = await _context.Students.SingleOrDefaultAsync(s => s.UserId == userId);
            if (student == null)
                return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy hồ sơ học sinh!" };

            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId && a.StudentId == student.UserId);

            if (assignment == null)
                return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy nhiệm vụ học tập!" };

            if (assignment.Status == "Completed")
            {
                return new BaseResponse
                {
                    IsSuccess = true,
                    Message = "Bài tập này đã được bạn hoàn thành trước đó rồi!"
                };
            }

            // Xác định danh sách câu hỏi bắt buộc cần hoàn thành
            List<int> requiredQuestionIds = new List<int>();
            if (!string.IsNullOrWhiteSpace(assignment.QuestionIds))
            {
                requiredQuestionIds = assignment.QuestionIds
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(s => int.TryParse(s, out int id) ? id : 0)
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();
            }
            else
            {
                requiredQuestionIds = await _context.Questions
                    .Where(q => q.LessonId == assignment.LessonId)
                    .Select(q => q.Id)
                    .Distinct()
                    .ToListAsync();
            }

            if (requiredQuestionIds.Any())
            {
                // Kiểm tra xem học sinh đã có lịch sử làm các câu hỏi này chưa
                var answeredQuestionIds = await _context.ErrorLogs
                    .Where(e => e.StudentId == student.UserId && requiredQuestionIds.Contains(e.QuestionId))
                    .Select(e => e.QuestionId)
                    .Distinct()
                    .ToListAsync();

                if (answeredQuestionIds.Count < requiredQuestionIds.Count)
                {
                    return new BaseResponse
                    {
                        IsSuccess = false,
                        Message = $"Bạn chưa hoàn thành đầy đủ các câu hỏi của bài tập ({answeredQuestionIds.Count}/{requiredQuestionIds.Count} câu). Vui lòng trả lời hết trước khi nộp bài!"
                    };
                }
            }

            assignment.Status = "Completed";
            await _context.SaveChangesAsync();

            return new BaseResponse
            {
                IsSuccess = true,
                Message = "Chúc mừng bạn đã hoàn thành xuất sắc bài tập!"
            };
        }
    }
}