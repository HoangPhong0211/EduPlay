namespace BE.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Danh sách tên học sinh do phụ huynh này quản lý
        public List<string> StudentNicknames { get; set; } = new List<string>();
    }
}