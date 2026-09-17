using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BE.Services;
using BE.DTOs;

namespace BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;
        private readonly QuestionService _questionService;

        // Gộp chung vào 1 Constructor duy nhất
        public AdminController(AdminService adminService, QuestionService questionService)
        {
            _adminService = adminService;
            _questionService = questionService;
        }

        [HttpPost("create-question")]
        public async Task<IActionResult> CreateQuestion([FromBody] CreateQuestionDto dto)
        {
            var result = await _adminService.CreateQuestionAsync(dto);
            if (!result.IsSuccess) return BadRequest(result);

            return StatusCode(201, result);
        }

        [HttpPost("generate-test")]
        public async Task<IActionResult> GenerateTest([FromBody] GenerateTestDto dto)
        {
            var result = await _adminService.GenerateAutoTestAsync(dto);
            return Ok(result);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _adminService.GetAllUsersAsync();
            return Ok(result);
        }

        [HttpPatch("users/{id}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var result = await _adminService.ToggleUserStatusAsync(id);
            if (!result.IsSuccess) return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("generate-hints")]
        public async Task<IActionResult> GenerateHints([FromBody] GenerateHintRequest request)
        {
            var result = await _questionService.GenerateHintsFromAiAsync(request);
            return Ok(result);
        }

        [HttpPut("questions/{id}/hint")]
        public async Task<IActionResult> SaveHint(int id, [FromBody] string selectedHint)
        {
            var result = await _questionService.SaveHintToDatabaseAsync(id, selectedHint);
            return Ok(result);
        }

        [HttpGet("questions")]
        public async Task<IActionResult> GetQuestions([FromQuery] int? lessonId)
        {
            var result = await _adminService.GetAllQuestionsAsync(lessonId);
            return Ok(result);
        }

        [HttpPut("questions/{id}")]
        public async Task<IActionResult> UpdateQuestion(int id, [FromBody] CreateQuestionDto dto)
        {
            var result = await _adminService.UpdateQuestionAsync(id, dto);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("questions/{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var result = await _adminService.DeleteQuestionAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }
    }
}