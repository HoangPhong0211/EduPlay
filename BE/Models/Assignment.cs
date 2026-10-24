namespace BE.Models
{
    public class Assignment
    {
        public int Id { get; set; } // Khóa chính (PK)
        public int ParentId { get; set; } // Khóa ngoại (FK) liên kết với Parent
        public int StudentId { get; set; } // Khóa ngoại (FK) liên kết với Student
        public int LessonId { get; set; } // Khóa ngoại (FK) liên kết với Lesson

        public string Status { get; set; } = "Assigned"; // Assigned, Completed
        public DateTime DueDate { get; set; } // Hạn chót
        public string? QuestionIds { get; set; } // Danh sách ID câu hỏi của bộ đề (nếu phát hành từ sinh đề ngẫu nhiên)
    }
}