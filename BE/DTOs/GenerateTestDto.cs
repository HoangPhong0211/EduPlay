using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    public class GenerateTestDto
    {
        [Required(ErrorMessage = "ID bài học không được để trống.")]
        public int LessonId { get; set; }
        
        [Range(0, 100, ErrorMessage = "Số câu hỏi dễ phải từ 0 đến 100.")]
        public int EasyCount { get; set; } = 4; // Mặc định 4 câu dễ
        
        [Range(0, 100, ErrorMessage = "Số câu hỏi trung bình phải từ 0 đến 100.")]
        public int MediumCount { get; set; } = 4; // Mặc định 4 câu trung bình
        
        [Range(0, 100, ErrorMessage = "Số câu hỏi khó phải từ 0 đến 100.")]
        public int HardCount { get; set; } = 2; // Mặc định 2 câu khó
    }

    public class PublishTestDto
    {
        [Required(ErrorMessage = "ID bài học không được để trống.")]
        public int LessonId { get; set; }

        public List<int>? QuestionIds { get; set; } // Danh sách ID các câu hỏi đã được Admin duyệt ngẫu nhiên

        public DateTime? DueDate { get; set; }
    }
}