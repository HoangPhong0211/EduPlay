namespace BE.Models
{
    public class Topic
    {
        public int Id { get; set; } // Khóa chính (PK)
        public int GradeLevel { get; set; } // Khối lớp (1, 2, 3)
        public string Name { get; set; } = string.Empty; // Tên chương mục
        public string? Description { get; set; }

        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}