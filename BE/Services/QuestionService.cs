using BE.Data;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;

namespace BE.Services
{
    public class QuestionService
    {
        private readonly EduPlayDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public QuestionService(EduPlayDbContext context, HttpClient httpClient, IConfiguration config)
        {
            _context = context;
            _httpClient = httpClient;
            _config = config;
        }

        public async Task<BaseResponse> GenerateHintsFromAiAsync(GenerateHintRequest request)
        {
            if (request == null)
                return new BaseResponse { IsSuccess = false, Message = "Dữ liệu yêu cầu không hợp lệ." };

            if (string.IsNullOrWhiteSpace(request.QuestionContent))
                return new BaseResponse { IsSuccess = false, Message = "Nội dung câu hỏi không được để trống." };

            if (request.GradeLevel < 1 || request.GradeLevel > 12)
                return new BaseResponse { IsSuccess = false, Message = "Mức độ lớp phải nằm trong khoảng 1 đến 12." };

            string apiKey = _config["AiSettings:ApiKey"] ?? string.Empty;
            string baseUrl = _config["AiSettings:BaseUrl"] ?? string.Empty;

            if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "ĐIỀN_API_KEY_THẬT_CỦA_BẠN_VÀO_ĐÂY")
                return new BaseResponse { IsSuccess = false, Message = "Chưa cấu hình API Key cho AI." };

            if (string.IsNullOrWhiteSpace(baseUrl))
                return new BaseResponse { IsSuccess = false, Message = "Chưa cấu hình BaseUrl cho AI." };

            var cleanQuestion = request.QuestionContent.Trim();
            string prompt = $"Đóng vai giáo viên tiểu học. Hãy viết 3 câu gợi ý ngắn gọn, dễ hiểu cho học sinh lớp {request.GradeLevel} nếu các em làm sai câu hỏi Toán sau: '{cleanQuestion}'. Trình bày rõ ràng thành 3 dòng chữ.";

            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            try
            {
                string requestUrl = $"{baseUrl}?key={apiKey}";
                var response = await _httpClient.PostAsync(requestUrl, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorText = await response.Content.ReadAsStringAsync();
                    return new BaseResponse { IsSuccess = false, Message = $"Lỗi kết nối với máy chủ AI. Chi tiết: {errorText}" };
                }

                var responseString = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(responseString))
                    return new BaseResponse { IsSuccess = false, Message = "Máy chủ AI trả về dữ liệu rỗng." };

                using JsonDocument doc = JsonDocument.Parse(responseString);

                if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.ValueKind != JsonValueKind.Array || candidates.GetArrayLength() == 0)
                    return new BaseResponse { IsSuccess = false, Message = "AI không trả về nội dung hợp lệ." };

                var firstCandidate = candidates[0];
                if (!firstCandidate.TryGetProperty("content", out var contentNode))
                    return new BaseResponse { IsSuccess = false, Message = "Phản hồi AI không chứa nội dung gợi ý." };

                if (!contentNode.TryGetProperty("parts", out var parts) || parts.ValueKind != JsonValueKind.Array || parts.GetArrayLength() == 0)
                    return new BaseResponse { IsSuccess = false, Message = "Phản hồi AI thiếu phần text." };

                var aiText = parts[0].TryGetProperty("text", out var textNode)
                    ? textNode.GetString()
                    : null;

                if (string.IsNullOrWhiteSpace(aiText))
                    return new BaseResponse { IsSuccess = false, Message = "Không sinh được gợi ý từ AI." };

                return new BaseResponse { IsSuccess = true, Message = aiText };
            }
            catch (JsonException)
            {
                return new BaseResponse { IsSuccess = false, Message = "Phản hồi từ AI không đúng định dạng JSON." };
            }
            catch (Exception ex)
            {
                return new BaseResponse { IsSuccess = false, Message = $"Lỗi hệ thống: {ex.Message}" };
            }
        }

        public async Task<BaseResponse> SaveHintToDatabaseAsync(int questionId, string selectedHint)
        {
            if (questionId <= 0)
                return new BaseResponse { IsSuccess = false, Message = "QuestionId không hợp lệ." };

            if (string.IsNullOrWhiteSpace(selectedHint))
                return new BaseResponse { IsSuccess = false, Message = "Gợi ý không được để trống." };

            var question = await _context.Questions.FindAsync(questionId);
            if (question == null)
                return new BaseResponse { IsSuccess = false, Message = "Không tìm thấy câu hỏi!" };

            question.Hint = selectedHint.Trim();
            await _context.SaveChangesAsync();

            return new BaseResponse { IsSuccess = true, Message = "Đã lưu gợi ý vào cơ sở dữ liệu thành công!" };
        }
    }
}