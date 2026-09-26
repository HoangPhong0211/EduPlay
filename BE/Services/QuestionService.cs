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
                    // Thử gọi qua endpoint gemini-3.5-flash-lite nếu model chính bị 404 hoặc 503
                    try
                    {
                        string fallbackModelUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={apiKey}";
                        var retryResponse = await _httpClient.PostAsync(fallbackModelUrl, content);
                        if (retryResponse.IsSuccessStatusCode)
                        {
                            var retryStr = await retryResponse.Content.ReadAsStringAsync();
                            using JsonDocument retryDoc = JsonDocument.Parse(retryStr);
                            if (retryDoc.RootElement.TryGetProperty("candidates", out var cands) && cands.GetArrayLength() > 0)
                            {
                                var text = cands[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                                if (!string.IsNullOrWhiteSpace(text))
                                {
                                    return new BaseResponse { IsSuccess = true, Message = text };
                                }
                            }
                        }
                    }
                    catch
                    {
                        // Bỏ qua để chuyển sang fallback sư phạm
                    }

                    // Fallback sư phạm thông minh khi API bên ngoài bận hoặc quá tải
                    return new BaseResponse { IsSuccess = true, Message = GeneratePedagogicalFallback(cleanQuestion, request.GradeLevel) };
                }

                var responseString = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(responseString))
                    return new BaseResponse { IsSuccess = true, Message = GeneratePedagogicalFallback(cleanQuestion, request.GradeLevel) };

                using JsonDocument doc = JsonDocument.Parse(responseString);

                if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.ValueKind != JsonValueKind.Array || candidates.GetArrayLength() == 0)
                    return new BaseResponse { IsSuccess = true, Message = GeneratePedagogicalFallback(cleanQuestion, request.GradeLevel) };

                var firstCandidate = candidates[0];
                if (!firstCandidate.TryGetProperty("content", out var contentNode))
                    return new BaseResponse { IsSuccess = true, Message = GeneratePedagogicalFallback(cleanQuestion, request.GradeLevel) };

                if (!contentNode.TryGetProperty("parts", out var parts) || parts.ValueKind != JsonValueKind.Array || parts.GetArrayLength() == 0)
                    return new BaseResponse { IsSuccess = true, Message = GeneratePedagogicalFallback(cleanQuestion, request.GradeLevel) };

                var aiText = parts[0].TryGetProperty("text", out var textNode)
                    ? textNode.GetString()
                    : null;

                if (string.IsNullOrWhiteSpace(aiText))
                    return new BaseResponse { IsSuccess = true, Message = GeneratePedagogicalFallback(cleanQuestion, request.GradeLevel) };

                return new BaseResponse { IsSuccess = true, Message = aiText };
            }
            catch (Exception)
            {
                return new BaseResponse { IsSuccess = true, Message = GeneratePedagogicalFallback(cleanQuestion, request.GradeLevel) };
            }
        }

        private static string GeneratePedagogicalFallback(string question, int gradeLevel)
        {
            return $"1. Con hãy đọc thật kỹ đề bài: '{question}' để nắm chắc phép tính hoặc yêu cầu.\n" +
                   $"2. Hãy dùng que tính, ngón tay hoặc vẽ các chấm tròn ra nháp để đếm từng bước thật cẩn thận.\n" +
                   $"3. Sau khi tính xong, con nhớ kiểm tra lại kết quả trước khi đưa ra câu trả lời nhé!";
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