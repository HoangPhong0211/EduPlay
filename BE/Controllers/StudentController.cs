using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BE.Services;
using BE.DTOs;

namespace BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Student")] // Chỉ Học sinh mới được nộp bài
    public class StudentController : ControllerBase
    {
        private readonly StudentService _studentService;

        public StudentController(StudentService studentService)
        {
            _studentService = studentService;
        }

        [HttpPost("submit-answer")]
        public async Task<IActionResult> SubmitAnswer([FromBody] SubmitAnswerDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("Phiên đăng nhập không hợp lệ.");

            var result = await _studentService.SubmitAnswerAsync(userId, dto);
            if (!result.IsSuccess) return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("Phiên đăng nhập không hợp lệ.");

            var result = await _studentService.GetStudentDashboardAsync(userId);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("roadmap/{gradeLevel}")]
        public async Task<IActionResult> GetRoadmap(int gradeLevel)
        {
            if (gradeLevel < 1 || gradeLevel > 5)
                return BadRequest(new { IsSuccess = false, Message = "Chỉ hỗ trợ lộ trình cho khối lớp 1 đến lớp 5." });

            var result = await _studentService.GetRoadmapAsync(gradeLevel);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("lesson/{lessonId}/questions")]
        public async Task<IActionResult> GetLessonQuestions(int lessonId)
        {
            var result = await _studentService.GetLessonQuestionsAsync(lessonId);
            return Ok(result);
        }

        [HttpGet("assignments")]
        public async Task<IActionResult> GetMyAssignments()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("Phiên đăng nhập không hợp lệ.");

            var result = await _studentService.GetMyAssignmentsAsync(userId);
            return Ok(result);
        }

        [HttpGet("assignment/{assignmentId}/questions")]
        public async Task<IActionResult> GetAssignmentQuestions(int assignmentId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("Phiên đăng nhập không hợp lệ.");

            var result = await _studentService.GetAssignmentQuestionsAsync(assignmentId, userId);
            if (result != null && result.GetType().GetProperty("IsSuccess")?.GetValue(result) is bool isSuccess && !isSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("complete-assignment/{assignmentId}")]
        public async Task<IActionResult> CompleteAssignment(int assignmentId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("Phiên đăng nhập không hợp lệ.");

            var result = await _studentService.CompleteAssignmentAsync(assignmentId, userId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}