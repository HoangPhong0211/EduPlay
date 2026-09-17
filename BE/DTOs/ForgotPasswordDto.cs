using System.ComponentModel.DataAnnotations;

namespace BE.DTOs
{
    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "Username không được để trống.")]
        public string Username { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "Username không được để trống.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã OTP không được để trống.")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải gồm 6 chữ số.")]
        public string OtpCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu mới không được để trống.")]
        [MinLength(8, ErrorMessage = "Mật khẩu mới phải có ít nhất 8 ký tự.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}