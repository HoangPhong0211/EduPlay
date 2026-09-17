namespace BE.Models
{
    public class Badge
    {
        public int Id { get; set; } // Khóa chính (PK)
        public string Name { get; set; } = string.Empty; // Tên huy hiệu
        public string IconUrl { get; set; } = string.Empty;
        public string? Description { get; set; }

        public ICollection<StudentBadge> StudentBadges { get; set; } = new List<StudentBadge>();
    }
}