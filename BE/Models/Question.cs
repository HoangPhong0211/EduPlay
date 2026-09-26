namespace BE.Models
{
    public class Question
    {
        public int Id { get; set; } // Khóa chính (PK)
        public int LessonId { get; set; } // Khóa ngoại (FK) liên kết với Lesson

        public string Content { get; set; } = string.Empty; // Nội dung câu hỏi
        public string QuestionType { get; set; } = "Trắc nghiệm"; // Loại câu hỏi: "Trắc nghiệm" hoặc "Điền đáp án"
        public string DifficultyLevel { get; set; } = string.Empty; // Độ khó: Dễ, Trung bình, Khó
        public string? Hint { get; set; } // Gợi ý khi làm sai
        public string CorrectAnswer { get; set; } = string.Empty;

        // 4 phương án lựa chọn cho câu hỏi trắc nghiệm (nullable)
        public string? OptionA { get; set; }
        public string? OptionB { get; set; }
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }
    }
}