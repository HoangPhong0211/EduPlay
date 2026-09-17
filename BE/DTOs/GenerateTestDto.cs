using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    public class GenerateTestDto
    {
        [Required(ErrorMessage = "ID bài học không được để trống.")]
        public int LessonId { get; set; }
        
        public int EasyCount { get; set; } = 4; // Mặc định 4 câu dễ
        public int MediumCount { get; set; } = 4; // Mặc định 4 câu trung bình
        public int HardCount { get; set; } = 2; // Mặc định 2 câu khó
    }
}