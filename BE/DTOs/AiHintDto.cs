using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    public class GenerateHintRequest
    {
        [Required(ErrorMessage = "Nội dung câu hỏi không được để trống.")]
        [StringLength(2000, MinimumLength = 10, ErrorMessage = "Nội dung câu hỏi phải từ 10 đến 2000 ký tự.")]
        public string QuestionContent { get; set; } = string.Empty;

        [Range(1, 12, ErrorMessage = "Mức độ lớp phải từ 1 đến 12.")]
        public int GradeLevel { get; set; }
    }
}