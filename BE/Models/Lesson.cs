namespace BE.Models
{
    public class Lesson
    {
        public int Id { get; set; } // Khóa chính (PK)
        public int TopicId { get; set; } // Khóa ngoại (FK) liên kết với Topic

        public string Title { get; set; } = string.Empty;
        public int OrderIndex { get; set; } // Thứ tự bài học
    }
}