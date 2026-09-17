namespace BE.Models
{
    public class ErrorLog
    {
        public int Id { get; set; } // Khóa chính (PK)
        public int StudentId { get; set; } // Khóa ngoại (FK) liên kết với Student
        public int QuestionId { get; set; } // Khóa ngoại (FK) liên kết với Question

        public string SubmittedAnswer { get; set; } = string.Empty; // Đáp án học sinh đã chọn
        public bool IsCorrect { get; set; } 
        public DateTime AttemptTime { get; set; } = DateTime.UtcNow; // Thời gian làm bài

        public Student Student { get; set; } = null!;
        public Question Question { get; set; } = null!;
    }
}