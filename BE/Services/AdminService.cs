using BE.Data;
using BE.Models;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using ClosedXML.Excel;

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
                if (string.IsNullOrWhiteSpace(dto.Content))
                    return new BaseResponse { IsSuccess = false, Message = "Nội dung câu hỏi không được để trống!" };

                if (!await _context.Lessons.AnyAsync(l => l.Id == dto.LessonId))
                    return new BaseResponse { IsSuccess = false, Message = "Bài học (Lesson) này không tồn tại!" };

                // Hệ thống hỗ trợ 2 loại câu hỏi: Trắc nghiệm và Điền đáp án
                if (string.IsNullOrWhiteSpace(dto.QuestionType) || dto.QuestionType.Equals("Trắc nghiệm", StringComparison.OrdinalIgnoreCase))
                {
                    dto.QuestionType = "Trắc nghiệm";
                }
                else if (dto.QuestionType.Equals("Điền đáp án", StringComparison.OrdinalIgnoreCase) ||
                         dto.QuestionType.Equals("Điền từ", StringComparison.OrdinalIgnoreCase) ||
                         dto.QuestionType.Equals("Tự luận ngắn", StringComparison.OrdinalIgnoreCase))
                {
                    dto.QuestionType = "Điền đáp án";
                }
                else
                {
                    return new BaseResponse { IsSuccess = false, Message = "Hệ thống hỗ trợ 2 loại câu hỏi: 'Trắc nghiệm' và 'Điền đáp án'." };
                }

                var validDifficulties = new List<string> { "Dễ", "Trung bình", "Khó" };
                if (!validDifficulties.Contains(dto.DifficultyLevel))
                    return new BaseResponse { IsSuccess = false, Message = "Độ khó chỉ được là 'Dễ', 'Trung bình' hoặc 'Khó'." };

                var question = new Question
                {
                    LessonId = dto.LessonId,
                    Content = dto.Content.Trim(),
                    QuestionType = dto.QuestionType,
                    DifficultyLevel = dto.DifficultyLevel,
                    CorrectAnswer = dto.CorrectAnswer.Trim(),
                    Hint = dto.Hint?.Trim(),
                    OptionA = dto.OptionA?.Trim(),
                    OptionB = dto.OptionB?.Trim(),
                    OptionC = dto.OptionC?.Trim(),
                    OptionD = dto.OptionD?.Trim()
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

        // Tính năng: Lấy danh sách câu hỏi
        public async Task<object> GetAllQuestionsAsync(int? lessonId)
        {
            try
            {
                var query = _context.Questions.AsQueryable();

                if (lessonId.HasValue)
                    query = query.Where(q => q.LessonId == lessonId.Value);

                var questions = await query.ToListAsync();
                return new { IsSuccess = true, Total = questions.Count, Data = questions };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách câu hỏi. LessonId: {LessonId}", lessonId);
                return new { IsSuccess = false, Total = 0, Message = "Lỗi hệ thống khi tải câu hỏi." };
            }
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

                // Hệ thống hỗ trợ 2 loại câu hỏi: Trắc nghiệm và Điền đáp án
                if (string.IsNullOrWhiteSpace(dto.QuestionType) || dto.QuestionType.Equals("Trắc nghiệm", StringComparison.OrdinalIgnoreCase))
                {
                    dto.QuestionType = "Trắc nghiệm";
                }
                else if (dto.QuestionType.Equals("Điền đáp án", StringComparison.OrdinalIgnoreCase) ||
                         dto.QuestionType.Equals("Điền từ", StringComparison.OrdinalIgnoreCase) ||
                         dto.QuestionType.Equals("Tự luận ngắn", StringComparison.OrdinalIgnoreCase))
                {
                    dto.QuestionType = "Điền đáp án";
                }
                else
                {
                    return new BaseResponse { IsSuccess = false, Message = "Hệ thống hỗ trợ 2 loại câu hỏi: 'Trắc nghiệm' và 'Điền đáp án'." };
                }

                var validDifficulties = new List<string> { "Dễ", "Trung bình", "Khó" };
                if (!validDifficulties.Contains(dto.DifficultyLevel))
                    return new BaseResponse { IsSuccess = false, Message = "Độ khó chỉ được là 'Dễ', 'Trung bình' hoặc 'Khó'." };

                question.LessonId = dto.LessonId;
                question.Content = dto.Content.Trim();
                question.QuestionType = dto.QuestionType;
                question.DifficultyLevel = dto.DifficultyLevel;
                question.CorrectAnswer = dto.CorrectAnswer.Trim();
                if (dto.Hint != null) question.Hint = dto.Hint.Trim();
                question.OptionA = dto.OptionA?.Trim();
                question.OptionB = dto.OptionB?.Trim();
                question.OptionC = dto.OptionC?.Trim();
                question.OptionD = dto.OptionD?.Trim();

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
            try
            {
                var question = await _context.Questions.FindAsync(id);
                if (question == null)
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy câu hỏi!" };

                // Kiểm tra ràng buộc khóa ngoại với bảng ErrorLogs
                bool hasAttempts = await _context.ErrorLogs.AnyAsync(e => e.QuestionId == id);
                if (hasAttempts)
                {
                    return new BaseResponse
                    {
                        IsSuccess = false,
                        Message = "Không thể xóa câu hỏi này vì đã có học sinh làm bài và ghi nhận lịch sử!"
                    };
                }

                _context.Questions.Remove(question);
                await _context.SaveChangesAsync();
                return new BaseResponse { IsSuccess = true, Message = "Đã xóa câu hỏi." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa câu hỏi QuestionId: {QuestionId}", id);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi xóa câu hỏi." };
            }
        }

        // Tính năng 2: Sinh đề tự động
        public async Task<object> GenerateAutoTestAsync(GenerateTestDto dto)
        {
            try
            {
                // Kiểm tra bài học tồn tại
                if (!await _context.Lessons.AnyAsync(l => l.Id == dto.LessonId))
                {
                    return new { IsSuccess = false, Message = "Bài học không tồn tại!" };
                }

                int totalRequested = dto.EasyCount + dto.MediumCount + dto.HardCount;
                if (totalRequested <= 0)
                {
                    return new { IsSuccess = false, Message = "Tổng số lượng câu hỏi yêu cầu phải lớn hơn 0!" };
                }

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
                        q.DifficultyLevel,
                        q.CorrectAnswer,
                        q.OptionA,
                        q.OptionB,
                        q.OptionC,
                        q.OptionD
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
                var parents = await _context.Parents.ToListAsync();

                var userDtos = users.Select(u =>
                {
                    var nicknames = new List<string>();
                    string? email = null;
                    string? phoneNumber = null;
                    int? totalPoints = null;

                    if (u.Role == "Parent")
                    {
                        var parentProfile = parents.FirstOrDefault(p => p.UserId == u.Id);
                        email = parentProfile?.Email;
                        phoneNumber = parentProfile?.PhoneNumber;

                        nicknames = students
                            .Where(s => s.ParentId == u.Id)
                            .Select(s => s.Nickname)
                            .ToList();
                    }
                    else if (u.Role == "Student")
                    {
                        var studentProfile = students.FirstOrDefault(s => s.UserId == u.Id);
                        if (studentProfile != null)
                        {
                            nicknames.Add(studentProfile.Nickname);
                            totalPoints = studentProfile.TotalPoints;
                        }
                    }

                    return new UserDto
                    {
                        Id = u.Id,
                        Username = u.Username,
                        Role = u.Role,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt,
                        StudentNicknames = nicknames,
                        Email = email,
                        PhoneNumber = phoneNumber,
                        TotalPoints = totalPoints
                    };
                }).ToList();

                return new { IsSuccess = true, Total = userDtos.Count, Data = userDtos };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách người dùng.");
                return new { IsSuccess = false, Message = "Lỗi hệ thống khi tải dữ liệu người dùng." };
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

        // --- QUẢN LÝ TOPICS (KHÓA HỌC / CHỦ ĐỀ) ---
        public async Task<object> GetAllTopicsAsync()
        {
            try
            {
                var topics = await _context.Topics.OrderBy(t => t.GradeLevel).ThenBy(t => t.Id).ToListAsync();
                return new { IsSuccess = true, Total = topics.Count, Data = topics };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách khóa học.");
                return new { IsSuccess = false, Total = 0, Message = "Lỗi hệ thống khi tải khóa học." };
            }
        }

        public async Task<BaseResponse> CreateTopicAsync(CreateTopicDto dto)
        {
            try
            {
                var topic = new Topic
                {
                    GradeLevel = dto.GradeLevel,
                    Name = dto.Name.Trim(),
                    Description = dto.Description?.Trim()
                };
                
                _context.Topics.Add(topic);
                await _context.SaveChangesAsync();
                
                return new BaseResponse { IsSuccess = true, Message = "Tạo khóa học thành công!" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo khóa học mới: {TopicName}", dto.Name);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi tạo khóa học." };
            }
        }

        public async Task<BaseResponse> UpdateTopicAsync(int id, CreateTopicDto dto)
        {
            try
            {
                var topic = await _context.Topics.FindAsync(id);
                if (topic == null) 
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy khóa học!" };

                topic.GradeLevel = dto.GradeLevel;
                topic.Name = dto.Name.Trim();
                topic.Description = dto.Description?.Trim();

                await _context.SaveChangesAsync();
                return new BaseResponse { IsSuccess = true, Message = "Cập nhật khóa học thành công!" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật khóa học TopicId: {TopicId}", id);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi cập nhật khóa học." };
            }
        }

        public async Task<BaseResponse> DeleteTopicAsync(int id)
        {
            try
            {
                var topic = await _context.Topics.FindAsync(id);
                if (topic == null) 
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy khóa học!" };

                // Xóa kèm các câu hỏi thuộc các bài học của chủ đề này để tránh mồ côi
                var lessonIds = await _context.Lessons
                    .Where(l => l.TopicId == id)
                    .Select(l => l.Id)
                    .ToListAsync();

                if (lessonIds.Count > 0)
                {
                    var questions = await _context.Questions
                        .Where(q => lessonIds.Contains(q.LessonId))
                        .ToListAsync();

                    if (questions.Count > 0)
                    {
                        _context.Questions.RemoveRange(questions);
                    }
                }

                _context.Topics.Remove(topic);
                await _context.SaveChangesAsync();
                return new BaseResponse { IsSuccess = true, Message = "Đã xóa khóa học thành công." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa khóa học TopicId: {TopicId}", id);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi xóa khóa học." };
            }
        }

        // --- QUẢN LÝ LESSONS (BÀI HỌC) ---
        public async Task<object> GetAllLessonsAsync(int? topicId)
        {
            try
            {
                var query = _context.Lessons.AsQueryable();
                
                if (topicId.HasValue)
                    query = query.Where(l => l.TopicId == topicId.Value);

                var lessons = await query.OrderBy(l => l.OrderIndex).ToListAsync();
                return new { IsSuccess = true, Total = lessons.Count, Data = lessons };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách bài học. TopicId: {TopicId}", topicId);
                return new { IsSuccess = false, Total = 0, Message = "Lỗi hệ thống khi tải bài học." };
            }
        }

        public async Task<BaseResponse> CreateLessonAsync(CreateLessonDto dto)
        {
            try
            {
                if (!await _context.Topics.AnyAsync(t => t.Id == dto.TopicId))
                    return new BaseResponse { IsSuccess = false, Message = "Khóa học không tồn tại!" };

                var lesson = new Lesson
                {
                    TopicId = dto.TopicId,
                    Title = dto.Title.Trim(),
                    OrderIndex = dto.OrderIndex
                };
                
                _context.Lessons.Add(lesson);
                await _context.SaveChangesAsync();
                
                return new BaseResponse { IsSuccess = true, Message = "Tạo bài học thành công!" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo bài học: {LessonTitle}", dto.Title);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi tạo bài học." };
            }
        }

        public async Task<BaseResponse> UpdateLessonAsync(int id, CreateLessonDto dto)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null) 
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy bài học!" };

                if (!await _context.Topics.AnyAsync(t => t.Id == dto.TopicId))
                    return new BaseResponse { IsSuccess = false, Message = "Khóa học không tồn tại!" };

                lesson.TopicId = dto.TopicId;
                lesson.Title = dto.Title.Trim();
                lesson.OrderIndex = dto.OrderIndex;

                await _context.SaveChangesAsync();
                return new BaseResponse { IsSuccess = true, Message = "Cập nhật bài học thành công!" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật bài học LessonId: {LessonId}", id);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi cập nhật bài học." };
            }
        }

        public async Task<BaseResponse> DeleteLessonAsync(int id)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null) 
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy bài học!" };

                // Xóa kèm các câu hỏi thuộc bài học này
                var questions = await _context.Questions.Where(q => q.LessonId == id).ToListAsync();
                if (questions.Count > 0)
                {
                    _context.Questions.RemoveRange(questions);
                }

                _context.Lessons.Remove(lesson);
                await _context.SaveChangesAsync();
                return new BaseResponse { IsSuccess = true, Message = "Đã xóa bài học." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa bài học LessonId: {LessonId}", id);
                return new BaseResponse { IsSuccess = false, Message = "Lỗi hệ thống khi xóa bài học." };
            }
        }

        // Tính năng: Nhập liệu bán tự động câu hỏi qua file Excel (.xlsx) (Bulk Import)
        // Hỗ trợ 2 loại câu hỏi: "Trắc nghiệm" và "Điền đáp án" (Tự luận ngắn)
        public async Task<BaseResponse> ImportQuestionsFromExcelAsync(IFormFile file, int lessonId)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return new BaseResponse { IsSuccess = false, Message = "Vui lòng chọn file Excel để tải lên." };
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (extension != ".xlsx")
                {
                    return new BaseResponse { IsSuccess = false, Message = "Hệ thống chỉ chấp nhận file định dạng Excel (.xlsx)." };
                }

                var questions = new List<Question>();

                using (var stream = new MemoryStream())
                {
                    await file.CopyToAsync(stream);
                    stream.Position = 0;

                    using (var workbook = new XLWorkbook(stream))
                    {
                        var worksheet = workbook.Worksheets.FirstOrDefault();
                        if (worksheet == null)
                        {
                            return new BaseResponse { IsSuccess = false, Message = "File Excel không chứa bất kỳ sheet dữ liệu nào." };
                        }

                        // Lấy các dòng dữ liệu (bỏ qua dòng 1 là tiêu đề)
                        var rows = worksheet.RowsUsed().Skip(1);
                        if (!rows.Any())
                        {
                            return new BaseResponse { IsSuccess = false, Message = "File Excel không có dữ liệu câu hỏi." };
                        }

                        // Lấy danh sách ID các bài học hợp lệ trong DB để đối chiếu khóa ngoại
                        var validLessonIds = await _context.Lessons.Select(l => l.Id).ToHashSetAsync();

                        foreach (var row in rows)
                        {
                            // Cột B (Cell 2): Nội dung câu hỏi (Content)
                            var content = row.Cell(2).Value.ToString().Trim();
                            if (string.IsNullOrWhiteSpace(content))
                            {
                                continue; // Bỏ qua các dòng nếu cột Content bị rỗng
                            }

                            // Cột A (Cell 1): LessonId (Nếu ô trống hoặc không hợp lệ thì dùng lessonId truyền vào)
                            int targetLessonId = lessonId;
                            var lessonIdStr = row.Cell(1).Value.ToString().Trim();
                            if (int.TryParse(lessonIdStr, out int parsedLessonId) && validLessonIds.Contains(parsedLessonId))
                            {
                                targetLessonId = parsedLessonId;
                            }
                            else if (!validLessonIds.Contains(targetLessonId))
                            {
                                continue; // Bỏ qua nếu không xác định được bài học hợp lệ
                            }

                            // Cột C (Cell 3): Loại câu hỏi (QuestionType - chứa chữ "Trắc nghiệm" hoặc "Điền đáp án")
                            var rawType = row.Cell(3).Value.ToString().Trim();
                            string questionType = "Trắc nghiệm";
                            if (rawType.Equals("Điền đáp án", StringComparison.OrdinalIgnoreCase) ||
                                rawType.Equals("Điền từ", StringComparison.OrdinalIgnoreCase) ||
                                rawType.Equals("Tự luận ngắn", StringComparison.OrdinalIgnoreCase))
                            {
                                questionType = "Điền đáp án";
                            }
                            else
                            {
                                questionType = "Trắc nghiệm";
                            }

                            // Cột D (Cell 4): Độ khó (DifficultyLevel - "Dễ", "Trung bình", "Khó")
                            var difficulty = row.Cell(4).Value.ToString().Trim();
                            if (difficulty != "Dễ" && difficulty != "Trung bình" && difficulty != "Khó")
                            {
                                difficulty = "Dễ"; // Mặc định nếu chưa đúng chuẩn
                            }

                            // Cột E (Cell 5): Đáp án đúng (CorrectAnswer)
                            var correctAnswer = row.Cell(5).Value.ToString().Trim();

                            // Cột F, G, H, I (Cell 6, 7, 8, 9): Tương ứng là OptionA, OptionB, OptionC, OptionD
                            var optA = row.Cell(6).Value.ToString().Trim();
                            var optB = row.Cell(7).Value.ToString().Trim();
                            var optC = row.Cell(8).Value.ToString().Trim();
                            var optD = row.Cell(9).Value.ToString().Trim();

                            string? optionA = string.IsNullOrWhiteSpace(optA) ? null : optA;
                            string? optionB = string.IsNullOrWhiteSpace(optB) ? null : optB;
                            string? optionC = string.IsNullOrWhiteSpace(optC) ? null : optC;
                            string? optionD = string.IsNullOrWhiteSpace(optD) ? null : optD;

                            var question = new Question
                            {
                                LessonId = targetLessonId,
                                Content = content,
                                QuestionType = questionType,
                                DifficultyLevel = difficulty,
                                CorrectAnswer = correctAnswer,
                                Hint = string.Empty, // Mặc định gán cứng là chuỗi rỗng
                                OptionA = optionA,
                                OptionB = optionB,
                                OptionC = optionC,
                                OptionD = optionD
                            };

                            questions.Add(question);
                        }
                    }
                }

                if (!questions.Any())
                {
                    return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy câu hỏi hợp lệ nào trong file Excel để nhập." };
                }

                _context.Questions.AddRange(questions);
                await _context.SaveChangesAsync();

                return new BaseResponse 
                { 
                    IsSuccess = true, 
                    Message = $"Đã nhập thành công {questions.Count} câu hỏi từ file Excel vào hệ thống." 
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi nhập câu hỏi từ file Excel.");
                return new BaseResponse { IsSuccess = false, Message = $"Lỗi hệ thống khi xử lý file Excel: {ex.Message}" };
            }
        }
    }
}