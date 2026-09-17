namespace BE.Models
{
    public class StudentBadge
    {
        public int StudentId { get; set; } // Khóa ngoại
        public int BadgeId { get; set; } // Khóa ngoại

        public DateTime EarnedAt { get; set; } = DateTime.UtcNow;

        public Student Student { get; set; }
        public Badge Badge { get; set; }
    }
}