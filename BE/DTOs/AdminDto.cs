using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    public class CreateQuestionDto
    {
        [Required(ErrorMessage = "ID bài học không được để trống")]
        public int LessonId { get; set; }
        
        [Required(ErrorMessage = "Nội dung câu hỏi không được để trống")]
        public string Content { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Loại câu hỏi không được để trống")]
        public string QuestionType { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Độ khó không được để trống")]
        public string DifficultyLevel { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Đáp án đúng không được để trống")]
        public string CorrectAnswer { get; set; } = string.Empty;
        
        public string? Hint { get; set; }
    }
}