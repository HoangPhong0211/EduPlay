namespace BE.Models
{
    public class Student
    {
        public int UserId { get; set; } // Sẽ làm Khóa chính (PK) & Khóa ngoại (FK) liên kết với User
        
        public int ParentId { get; set; } // Khóa ngoại liên kết với Parent

        public string Nickname { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int TotalPoints { get; set; } = 0;
        public int TimeLimitMinutes { get; set; } = 60;
    }
}