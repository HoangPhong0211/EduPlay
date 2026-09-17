using Microsoft.AspNetCore.Mvc;
using BE.Services;
using BE.DTOs;

namespace BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            // DTO Validation tự động được kiểm tra bởi thuộc tính [ApiController] 

            var result = await _authService.RegisterAsync(dto);

            if (!result.IsSuccess)
            {
                // Trả về 409 Conflict nếu username đã tồn tại
                if (result.Message.Contains("tồn tại"))
                    return Conflict(result);

                // Trả về 400 cho các lỗi logic khác
                return BadRequest(result);
            }

            // Trả về 201 Created khi tạo thành công
            return StatusCode(201, result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (!result.IsSuccess)
                return Unauthorized(result); // Trả về lỗi 401 nếu sai mật khẩu

            return Ok(result); // Trả về 200 kèm Token
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var result = await _authService.GenerateAndSendOtpAsync(dto);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var result = await _authService.ResetPasswordWithOtpAsync(dto);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}