namespace BE.Models
{
    public class User
    {
        public int Id { get; set; } // Khóa chính (PK)
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "Admin", "Parent", "Student"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}