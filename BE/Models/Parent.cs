namespace BE.Models
{
    public class Parent
    {
        public int UserId { get; set; } // Sẽ làm Khóa chính (PK) & Khóa ngoại (FK) liên kết với User
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }
}