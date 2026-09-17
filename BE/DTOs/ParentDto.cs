using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    public class CreateStudentDto
    {
        [Required(ErrorMessage = "Tên đăng nhập của con không được để trống.")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Chỉ chứa chữ, số và dấu gạch dưới.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu không được để trống.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Biệt danh (Nickname) không được để trống.")]
        public string Nickname { get; set; } = string.Empty;
    }

    public class SetTimeLimitDto
    {
        [Required(ErrorMessage = "ID học sinh không được để trống.")]
        public int StudentId { get; set; }
        
        [Required(ErrorMessage = "Thời gian học không được để trống.")]
        [Range(1, 240, ErrorMessage = "Thời gian học tối đa là 240 phút (4 tiếng), tối thiểu 1 phút.")]
        public int TimeLimitMinutes { get; set; }
    }

    public class CreateAssignmentDto
    {
        [Required(ErrorMessage = "ID học sinh không được để trống.")]
        public int StudentId { get; set; }
        
        [Required(ErrorMessage = "ID bài học không được để trống.")]
        public int LessonId { get; set; }
        
        [Required(ErrorMessage = "Hạn chế không được để trống.")]
        public DateTime DueDate { get; set; }
    }
}