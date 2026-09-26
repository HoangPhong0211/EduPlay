using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

        [HttpPost("import-excel")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ImportQuestionsFromExcel([FromForm] IFormFile file, [FromForm] int? lessonId = null, [FromForm] int? defaultLessonId = null)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new BaseResponse { IsSuccess = false, Message = "Vui lòng chọn file Excel để tải lên." });
            }

            int targetLessonId = lessonId ?? defaultLessonId ?? 0;
            var result = await _adminService.ImportQuestionsFromExcelAsync(file, targetLessonId);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("generate-test")]
        public async Task<IActionResult> GenerateTest([FromBody] GenerateTestDto dto)
        {
            var result = await _adminService.GenerateAutoTestAsync(dto);
            if (result != null && result.GetType().GetProperty("IsSuccess")?.GetValue(result) is bool isSuccess && !isSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _adminService.GetAllUsersAsync();
            if (result != null && result.GetType().GetProperty("IsSuccess")?.GetValue(result) is bool isSuccess && !isSuccess)
            {
                return StatusCode(500, result);
            }
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
            if (!result.IsSuccess) return BadRequest(result);

            return Ok(result);
        }

        [HttpPut("questions/{id}/hint")]
        public async Task<IActionResult> SaveHint(int id, [FromBody] SaveHintDto dto)
        {
            var result = await _questionService.SaveHintToDatabaseAsync(id, dto.Hint);
            if (!result.IsSuccess) return BadRequest(result);

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
            if (!result.IsSuccess)
            {
                if (result.Message.Contains("Không tìm thấy")) return NotFound(result);
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("topics")]
        public async Task<IActionResult> GetTopics()
        {
            var result = await _adminService.GetAllTopicsAsync();
            return Ok(result);
        }

        [HttpPost("topics")]
        public async Task<IActionResult> CreateTopic([FromBody] CreateTopicDto dto)
        {
            var result = await _adminService.CreateTopicAsync(dto);
            if (!result.IsSuccess) return BadRequest(result);
            return StatusCode(201, result);
        }

        [HttpPut("topics/{id}")]
        public async Task<IActionResult> UpdateTopic(int id, [FromBody] CreateTopicDto dto)
        {
            var result = await _adminService.UpdateTopicAsync(id, dto);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("topics/{id}")]
        public async Task<IActionResult> DeleteTopic(int id)
        {
            var result = await _adminService.DeleteTopicAsync(id);
            if (!result.IsSuccess)
            {
                if (result.Message.Contains("Không tìm thấy")) return NotFound(result);
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("lessons")]
        public async Task<IActionResult> GetLessons([FromQuery] int? topicId)
        {
            var result = await _adminService.GetAllLessonsAsync(topicId);
            return Ok(result);
        }

        [HttpPost("lessons")]
        public async Task<IActionResult> CreateLesson([FromBody] CreateLessonDto dto)
        {
            var result = await _adminService.CreateLessonAsync(dto);
            if (!result.IsSuccess) return BadRequest(result);
            return StatusCode(201, result);
        }

        [HttpPut("lessons/{id}")]
        public async Task<IActionResult> UpdateLesson(int id, [FromBody] CreateLessonDto dto)
        {
            var result = await _adminService.UpdateLessonAsync(id, dto);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("lessons/{id}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            var result = await _adminService.DeleteLessonAsync(id);
            if (!result.IsSuccess)
            {
                if (result.Message.Contains("Không tìm thấy")) return NotFound(result);
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}