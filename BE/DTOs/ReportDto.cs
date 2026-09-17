namespace BE.DTOs
{
    public class StudentReportDto
    {
        public int TotalAttempts { get; set; }
        public int CorrectAnswers { get; set; }
        public double AccuracyRate { get; set; }
        public List<MistakeDetailDto> RecentMistakes { get; set; } = new();
    }

    public class MistakeDetailDto
    {
        public string QuestionContent { get; set; } = string.Empty;
        public string SubmittedAnswer { get; set; } = string.Empty;
        public DateTime AttemptTime { get; set; }
        public string Hint { get; set; } = string.Empty; // Gợi ý từ AI đã lưu trong DB
    }
}