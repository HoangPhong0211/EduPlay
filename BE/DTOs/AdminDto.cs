using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    public class CreateQuestionDto
    {
        [Required(ErrorMessage = "ID bài học không được để trống")]
        public int LessonId { get; set; }
        
        [Required(ErrorMessage = "Nội dung câu hỏi không được để trống")]
        public string Content { get; set; } = string.Empty;
        
        public string QuestionType { get; set; } = "Trắc nghiệm";
        
        [Required(ErrorMessage = "Độ khó không được để trống")]
        public string DifficultyLevel { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Đáp án đúng không được để trống")]
        public string CorrectAnswer { get; set; } = string.Empty;
        
        public string? Hint { get; set; }

        public string? OptionA { get; set; }
        public string? OptionB { get; set; }
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }
    }

    public class CreateTopicDto
    {
        [Required(ErrorMessage = "Khối lớp không được để trống")]
        [Range(1, 5, ErrorMessage = "Khối lớp phải từ 1 đến 5")]
        public int GradeLevel { get; set; }
        
        [Required(ErrorMessage = "Tên chương mục không được để trống")]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
    }

    public class CreateLessonDto
    {
        [Required(ErrorMessage = "ID khóa học không được để trống")]
        public int TopicId { get; set; }
        
        [Required(ErrorMessage = "Tên bài học không được để trống")]
        public string Title { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Thứ tự bài học không được để trống")]
        [Range(1, int.MaxValue, ErrorMessage = "Thứ tự bài học phải lớn hơn 0.")]
        public int OrderIndex { get; set; }
    }

    public class SaveHintDto
    {
        [Required(ErrorMessage = "Gợi ý không được để trống")]
        public string Hint { get; set; } = string.Empty;
    }

    public class ImportQuestionsExcelDto
    {
        public Microsoft.AspNetCore.Http.IFormFile? File { get; set; }
        public int? LessonId { get; set; }
        public int? DefaultLessonId { get; set; }
    }
}