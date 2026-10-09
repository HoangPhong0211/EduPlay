using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BE.Services;
using BE.DTOs;
using System.Security.Claims;

namespace BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Parent")]
    public class ParentController : ControllerBase
    {
        private readonly ParentService _parentService;
        private readonly ReportService _reportService;

        public ParentController(ParentService parentService, ReportService reportService)
        {
            _parentService = parentService;
            _reportService = reportService;
        }

        [HttpPost("create-student")]
        public async Task<IActionResult> CreateStudent(
            [FromBody] CreateStudentDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
                return Unauthorized("Không tìm thấy ID người dùng.");

            if (!int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("ID người dùng không hợp lệ.");

            var result = await _parentService
                .CreateStudentAccountAsync(userId, dto);

            if (!result.IsSuccess)
                return BadRequest(result);

            return StatusCode(201, result);
        }

        [HttpGet("report/{studentId}")]
        public async Task<IActionResult> GetCompetencyReport(int studentId)
        {
            // Bóc tách Token để lấy ID của phụ huynh
            var parentIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (parentIdClaim == null) return Unauthorized("Không tìm thấy ID người dùng.");

            int parentId = int.Parse(parentIdClaim.Value);

            var report = await _reportService.GetStudentReportAsync(parentId, studentId);

            if (report == null)
                return Forbid("Bạn không có quyền xem báo cáo của học sinh này hoặc học sinh không tồn tại.");

            return Ok(report);
        }

        [HttpPut("time-limit")]
        public async Task<IActionResult> SetTimeLimit([FromBody] SetTimeLimitDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int parentId))
                return Unauthorized();

            var result = await _parentService.SetTimeLimitAsync(parentId, dto);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("assignment")]
        public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int parentId))
                return Unauthorized();

            var result = await _parentService.AssignTaskAsync(parentId, dto);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("students")]
        public async Task<IActionResult> GetMyStudents()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int parentId))
                return Unauthorized("Không tìm thấy ID người dùng.");

            var result = await _parentService.GetMyStudentsAsync(parentId);
            return Ok(result);
        }

        [HttpGet("assignments")]
        public async Task<IActionResult> GetMyAssignments()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int parentId))
                return Unauthorized("Không tìm thấy ID người dùng.");

            var result = await _parentService.GetMyAssignmentsAsync(parentId);
            return Ok(result);
        }

        [HttpGet("lessons")]
        public async Task<IActionResult> GetAvailableLessons()
        {
            var result = await _parentService.GetAvailableLessonsAsync();
            return Ok(result);
        }
    }
}