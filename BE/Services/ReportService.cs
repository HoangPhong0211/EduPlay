using BE.Data;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ReportService
    {
        private readonly EduPlayDbContext _context;

        public ReportService(EduPlayDbContext context)
        {
            _context = context;
        }

        public async Task<StudentReportDto?> GetStudentReportAsync(int parentId, int studentId)
        {
            // 1. Bảo mật: Xác minh học sinh này có đúng là con của phụ huynh đang gửi Request không
            var isMyChild = await _context.Students
                .AnyAsync(s => s.UserId == studentId && s.ParentId == parentId);

            if (!isMyChild)
                return null; // Từ chối truy cập nếu không phải con mình

            // 2. Truy xuất toàn bộ lịch sử làm bài từ bảng ERROR_LOGS
            var logs = await _context.ErrorLogs
                .Include(e => e.Question) // Lấy kèm nội dung câu hỏi từ bảng QUESTIONS
                .Where(e => e.StudentId == studentId)
                .OrderByDescending(e => e.AttemptTime)
                .ToListAsync();

            int total = logs.Count;
            int correct = logs.Count(e => e.IsCorrect);

            // 3. Đóng gói dữ liệu báo cáo
            var report = new StudentReportDto
            {
                TotalAttempts = total,
                CorrectAnswers = correct,
                AccuracyRate = total > 0 ? Math.Round((double)correct / total * 100, 2) : 0,
                
                // Lọc ra các câu sai, sắp xếp thời gian mới nhất và lấy 5 câu
                RecentMistakes = logs
                    .Where(e => !e.IsCorrect)
                    .Take(5)
                    .Select(e => new MistakeDetailDto
                    {
                        QuestionContent = e.Question != null ? e.Question.Content : "Không xác định",
                        SubmittedAnswer = e.SubmittedAnswer,
                        AttemptTime = e.AttemptTime,
                        Hint = e.Question != null ? e.Question.Hint ?? string.Empty : string.Empty
                    })
                    .ToList()
            };

            return report;
        }
    }
}