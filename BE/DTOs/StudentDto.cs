using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    public class SubmitAnswerDto
    {
        [Required(ErrorMessage = "Câu hỏi không được để trống")]
        [Range(1, int.MaxValue)]
        public int QuestionId { get; set; }

        [Required(ErrorMessage = "Đáp án không được để trống")]
        [StringLength(500, MinimumLength = 1)]
        public string SubmittedAnswer { get; set; } = string.Empty;

    }
}