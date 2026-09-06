namespace BE.Models
{
    public class Question
    {
        public int Id { get; set; } // Khóa chính (PK)
        public int LessonId { get; set; } // Khóa ngoại (FK) liên kết với Lesson

        public string Content { get; set; } = string.Empty; // Nội dung câu hỏi
        public string QuestionType { get; set; } = string.Empty; // Kéo thả, trắc nghiệm
        public string DifficultyLevel { get; set; } = string.Empty; // Độ khó: Dễ, Trung bình, Khó
        public string? Hint { get; set; } // Gợi ý khi làm sai
    }
}