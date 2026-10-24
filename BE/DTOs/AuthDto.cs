using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    // Chuyển Role sang Enum để tránh lỗi gõ sai chữ (Typo)
    public enum UserRole
    {
        Admin = 1,
        Parent = 2,
        Student = 3
    }

    public class AuthResponse
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
    }

    public class RegisterDto
    {
        [Required(ErrorMessage = "Username không được để trống.")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username chỉ chứa chữ, số và dấu gạch dưới.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password không được để trống.")]
        [MinLength(8, ErrorMessage = "Password phải có ít nhất 8 ký tự.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role không được để trống.")]
        [EnumDataType(typeof(UserRole), ErrorMessage = "Quyền hạn không hợp lệ. Vui lòng chọn 1 (Admin), 2 (Parent) hoặc 3 (Student).")]
        public UserRole? Role { get; set; }
    }

    public class LoginDto
    {
        [Required(ErrorMessage = "Username không được để trống.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password không được để trống.")]
        public string Password { get; set; } = string.Empty;
    }
}