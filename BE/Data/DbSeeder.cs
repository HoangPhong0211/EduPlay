using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BE.Models;

namespace BE.Data
{
    public static class DbSeeder
    {
        public static async Task SeedSampleDataAsync(EduPlayDbContext context)
        {
            // 1. Tự động khởi tạo Huy hiệu (Badges) chuẩn
            var defaultBadges = new List<Badge>
            {
                new Badge { Name = "Chăm chỉ", Description = "Đạt mốc 50 điểm tích lũy học tập", IconUrl = "star" },
                new Badge { Name = "Thông minh", Description = "Đạt mốc 100 điểm tích lũy học tập", IconUrl = "bulb" },
                new Badge { Name = "Chiến binh Toán học", Description = "Đạt mốc 200 điểm tích lũy học tập", IconUrl = "medal" },
                new Badge { Name = "Bậc thầy Khám phá", Description = "Đạt mốc 300 điểm tích lũy học tập", IconUrl = "crown" }
            };

            foreach (var badge in defaultBadges)
            {
                if (!await context.Badges.AnyAsync(b => b.Name == badge.Name))
                {
                    context.Badges.Add(badge);
                }
            }
            await context.SaveChangesAsync();

            // 2. Tự động khởi tạo Tài khoản mẫu (Admin, Parent, Students)
            string defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123@");

            // 2.1 Tài khoản Quản trị viên (Admin)
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            if (adminUser == null)
            {
                adminUser = new User
                {
                    Username = "admin",
                    PasswordHash = defaultPasswordHash,
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(adminUser);
                await context.SaveChangesAsync();
            }

            // 2.2 Tài khoản Phụ huynh (Parent)
            var parentUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "parent1");
            if (parentUser == null)
            {
                parentUser = new User
                {
                    Username = "parent1",
                    PasswordHash = defaultPasswordHash,
                    Role = "Parent",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(parentUser);
                await context.SaveChangesAsync();

                var parentProfile = new Parent
                {
                    UserId = parentUser.Id,
                    Email = "phuhuynh@gmail.com",
                    PhoneNumber = "0901234567"
                };
                context.Parents.Add(parentProfile);
                await context.SaveChangesAsync();
            }

            // 2.3 Tài khoản Học sinh 1: Bé Bo
            var student1User = await context.Users.FirstOrDefaultAsync(u => u.Username == "student1");
            if (student1User == null)
            {
                student1User = new User
                {
                    Username = "student1",
                    PasswordHash = defaultPasswordHash,
                    Role = "Student",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(student1User);
                await context.SaveChangesAsync();

                var student1Profile = new Student
                {
                    UserId = student1User.Id,
                    ParentId = parentUser.Id,
                    Nickname = "Bé Bo",
                    TotalPoints = 120,
                    TimeLimitMinutes = 60
                };
                context.Students.Add(student1Profile);
                await context.SaveChangesAsync();

                // Gán sẵn 2 huy hiệu: Chăm chỉ (50đ) & Thông minh (100đ)
                var badgeChamChi = await context.Badges.FirstOrDefaultAsync(b => b.Name == "Chăm chỉ");
                var badgeThongMinh = await context.Badges.FirstOrDefaultAsync(b => b.Name == "Thông minh");

                if (badgeChamChi != null && !await context.StudentBadges.AnyAsync(sb => sb.StudentId == student1Profile.UserId && sb.BadgeId == badgeChamChi.Id))
                {
                    context.StudentBadges.Add(new StudentBadge { StudentId = student1Profile.UserId, BadgeId = badgeChamChi.Id, EarnedAt = DateTime.UtcNow.AddDays(-2) });
                }
                if (badgeThongMinh != null && !await context.StudentBadges.AnyAsync(sb => sb.StudentId == student1Profile.UserId && sb.BadgeId == badgeThongMinh.Id))
                {
                    context.StudentBadges.Add(new StudentBadge { StudentId = student1Profile.UserId, BadgeId = badgeThongMinh.Id, EarnedAt = DateTime.UtcNow.AddDays(-1) });
                }
                await context.SaveChangesAsync();
            }

            // 2.4 Tài khoản Học sinh 2: Bé Bông
            var student2User = await context.Users.FirstOrDefaultAsync(u => u.Username == "student2");
            if (student2User == null)
            {
                student2User = new User
                {
                    Username = "student2",
                    PasswordHash = defaultPasswordHash,
                    Role = "Student",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(student2User);
                await context.SaveChangesAsync();

                var student2Profile = new Student
                {
                    UserId = student2User.Id,
                    ParentId = parentUser.Id,
                    Nickname = "Bé Bông",
                    TotalPoints = 40,
                    TimeLimitMinutes = 45
                };
                context.Students.Add(student2Profile);
                await context.SaveChangesAsync();
            }

            // 3. Khởi tạo Chương trình học (Topics, Lessons, Questions)
            // 3.1 KHỐI LỚP 1
            await SeedGrade1Async(context);

            // 3.2 KHỐI LỚP 2
            await SeedGrade2Async(context);

            // 3.3 KHỐI LỚP 3
            await SeedGrade3Async(context);

            // 4. Khởi tạo Nhiệm vụ mẫu (Assignments)
            var anyLesson = await context.Lessons.FirstOrDefaultAsync();
            if (anyLesson != null && student1User != null)
            {
                var lessonCong5 = await context.Lessons.FirstOrDefaultAsync(l => l.Title.Contains("Phép cộng trong phạm vi 5")) ?? anyLesson;
                var lessonSoSanh = await context.Lessons.FirstOrDefaultAsync(l => l.Title.Contains("So sánh")) ?? anyLesson;

                // Nhiệm vụ 1: Đã hoàn thành
                if (!await context.Assignments.AnyAsync(a => a.StudentId == student1User.Id && a.LessonId == lessonCong5.Id))
                {
                    context.Assignments.Add(new Assignment
                    {
                        ParentId = parentUser.Id,
                        StudentId = student1User.Id,
                        LessonId = lessonCong5.Id,
                        DueDate = DateTime.UtcNow.AddDays(1),
                        Status = "Completed"
                    });
                }

                // Nhiệm vụ 2: Đang được giao kèm đề ngẫu nhiên QuestionIds
                if (!await context.Assignments.AnyAsync(a => a.StudentId == student1User.Id && a.LessonId == lessonSoSanh.Id))
                {
                    var qIds = await context.Questions.Where(q => q.LessonId == lessonSoSanh.Id).Take(3).Select(q => q.Id).ToListAsync();
                    context.Assignments.Add(new Assignment
                    {
                        ParentId = parentUser.Id,
                        StudentId = student1User.Id,
                        LessonId = lessonSoSanh.Id,
                        DueDate = DateTime.UtcNow.AddDays(3),
                        Status = "Assigned",
                        QuestionIds = qIds.Any() ? string.Join(",", qIds) : null
                    });
                }

                // Nhiệm vụ 3: Giao cho Bé Bông
                if (student2User != null && !await context.Assignments.AnyAsync(a => a.StudentId == student2User.Id))
                {
                    context.Assignments.Add(new Assignment
                    {
                        ParentId = parentUser.Id,
                        StudentId = student2User.Id,
                        LessonId = anyLesson.Id,
                        DueDate = DateTime.UtcNow.AddDays(5),
                        Status = "Assigned"
                    });
                }
                await context.SaveChangesAsync();
            }

            // 5. Khởi tạo Lịch sử làm bài mẫu (ErrorLogs) cho Bé Bo để hiển thị Báo cáo học tập
            if (student1User != null && !await context.ErrorLogs.AnyAsync(e => e.StudentId == student1User.Id))
            {
                var sampleQuestions = await context.Questions.Take(5).ToListAsync();
                if (sampleQuestions.Count >= 3)
                {
                    // 2 câu đúng
                    context.ErrorLogs.Add(new ErrorLog
                    {
                        StudentId = student1User.Id,
                        QuestionId = sampleQuestions[0].Id,
                        SubmittedAnswer = sampleQuestions[0].CorrectAnswer,
                        IsCorrect = true,
                        AttemptTime = DateTime.UtcNow.AddDays(-1)
                    });

                    context.ErrorLogs.Add(new ErrorLog
                    {
                        StudentId = student1User.Id,
                        QuestionId = sampleQuestions[1].Id,
                        SubmittedAnswer = sampleQuestions[1].CorrectAnswer,
                        IsCorrect = true,
                        AttemptTime = DateTime.UtcNow.AddHours(-3)
                    });

                    // 1 câu sai (để phụ huynh thấy lỗi sai cần khắc phục)
                    string wrongAns = sampleQuestions[2].CorrectAnswer == "3" ? "4" : "1";
                    context.ErrorLogs.Add(new ErrorLog
                    {
                        StudentId = student1User.Id,
                        QuestionId = sampleQuestions[2].Id,
                        SubmittedAnswer = wrongAns,
                        IsCorrect = false,
                        AttemptTime = DateTime.UtcNow.AddHours(-1)
                    });

                    await context.SaveChangesAsync();
                }
            }
        }

        private static async Task SeedGrade1Async(EduPlayDbContext context)
        {
            // Chủ đề 1: Đếm và các số trong phạm vi 10
            var topic1 = await context.Topics.FirstOrDefaultAsync(t => t.Name == "Đếm và các số trong phạm vi 10" && t.GradeLevel == 1);
            if (topic1 == null)
            {
                topic1 = new Topic
                {
                    GradeLevel = 1,
                    Name = "Đếm và các số trong phạm vi 10",
                    Description = "Nhận biết, đọc, viết và so sánh các số từ 0 đến 10"
                };
                context.Topics.Add(topic1);
                await context.SaveChangesAsync();
            }

            // Bài 1: Nhận biết các số từ 1 đến 5
            var lesson1 = await context.Lessons.FirstOrDefaultAsync(l => l.TopicId == topic1.Id && l.Title == "Nhận biết các số từ 1 đến 5");
            if (lesson1 == null)
            {
                lesson1 = new Lesson { TopicId = topic1.Id, Title = "Nhận biết các số từ 1 đến 5", OrderIndex = 1 };
                context.Lessons.Add(lesson1);
                await context.SaveChangesAsync();

                // Câu hỏi Bài 1
                var questionsL1 = new List<Question>
                {
                    new Question
                    {
                        LessonId = lesson1.Id,
                        Content = "Có bao nhiêu quả táo trong giỏ nếu đếm được: 🍎, 🍎, 🍎?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Dễ",
                        OptionA = "2", OptionB = "3", OptionC = "4", OptionD = "5",
                        CorrectAnswer = "3",
                        Hint = "Bé hãy đếm từng quả một: 1, 2, 3 nhé!"
                    },
                    new Question
                    {
                        LessonId = lesson1.Id,
                        Content = "Điền số thích hợp vào chỗ trống: 1, 2, ..., 4, 5",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Dễ",
                        CorrectAnswer = "3",
                        Hint = "Số đứng ngay sau số 2 và đứng trước số 4 là số nào?"
                    },
                    new Question
                    {
                        LessonId = lesson1.Id,
                        Content = "Bàn tay của em có bao nhiêu ngón tay?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Trung bình",
                        OptionA = "4", OptionB = "5", OptionC = "6", OptionD = "10",
                        CorrectAnswer = "5",
                        Hint = "Em hãy giơ một bàn tay lên và đếm các ngón tay nhé!"
                    },
                    new Question
                    {
                        LessonId = lesson1.Id,
                        Content = "Số nào lớn nhất trong các số sau: 1, 4, 2, 5?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Trung bình",
                        CorrectAnswer = "5",
                        Hint = "Số đứng cuối cùng khi đếm từ 1 đến 5 là số lớn nhất."
                    },
                    new Question
                    {
                        LessonId = lesson1.Id,
                        Content = "Bác nông dân có 2 con gà trống và 2 con gà mái. Hỏi bác nông dân có tất cả mấy con gà?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Khó",
                        OptionA = "3", OptionB = "4", OptionC = "5", OptionD = "2",
                        CorrectAnswer = "4",
                        Hint = "Lấy số gà trống cộng với số gà mái: 2 + 2 = ?"
                    },
                    new Question
                    {
                        LessonId = lesson1.Id,
                        Content = "Hình tam giác có bao nhiêu cạnh?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Khó",
                        CorrectAnswer = "3",
                        Hint = "Tam nghĩa là 3, hình tam giác có 3 đỉnh và 3 cạnh."
                    }
                };
                context.Questions.AddRange(questionsL1);
                await context.SaveChangesAsync();
            }

            // Bài 2: So sánh lớn hơn, bé hơn, bằng nhau (<, >, =)
            var lesson2 = await context.Lessons.FirstOrDefaultAsync(l => l.TopicId == topic1.Id && l.Title == "So sánh lớn hơn, bé hơn, bằng nhau (<, >, =)");
            if (lesson2 == null)
            {
                lesson2 = new Lesson { TopicId = topic1.Id, Title = "So sánh lớn hơn, bé hơn, bằng nhau (<, >, =)", OrderIndex = 2 };
                context.Lessons.Add(lesson2);
                await context.SaveChangesAsync();

                var questionsL2 = new List<Question>
                {
                    new Question
                    {
                        LessonId = lesson2.Id,
                        Content = "Điền dấu thích hợp vào chỗ trống: 4 ... 2",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Dễ",
                        OptionA = ">", OptionB = "<", OptionC = "=", OptionD = "+",
                        CorrectAnswer = ">",
                        Hint = "Số 4 nhiều hơn số 2 nên ta dùng dấu lớn hơn (>)."
                    },
                    new Question
                    {
                        LessonId = lesson2.Id,
                        Content = "Điền dấu thích hợp vào chỗ trống: 5 ... 5",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Dễ",
                        CorrectAnswer = "=",
                        Hint = "Hai số giống hệt nhau thì ta điền dấu bằng (=)."
                    },
                    new Question
                    {
                        LessonId = lesson2.Id,
                        Content = "Điền dấu thích hợp: 3 ... 7",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Trung bình",
                        OptionA = ">", OptionB = "<", OptionC = "=", OptionD = "-",
                        CorrectAnswer = "<",
                        Hint = "Số 3 đứng trước số 7 nên số 3 bé hơn số 7."
                    },
                    new Question
                    {
                        LessonId = lesson2.Id,
                        Content = "Số lớn nhất có một chữ số là số mấy?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Trung bình",
                        CorrectAnswer = "9",
                        Hint = "Đó là số ngay trước số 10."
                    },
                    new Question
                    {
                        LessonId = lesson2.Id,
                        Content = "Dãy số nào sau đây được sắp xếp theo thứ tự từ bé đến lớn?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Khó",
                        OptionA = "1, 3, 2, 5", OptionB = "2, 4, 6, 8", OptionC = "9, 7, 5, 3", OptionD = "5, 4, 3, 2",
                        CorrectAnswer = "2, 4, 6, 8",
                        Hint = "Từ bé đến lớn nghĩa là số đứng sau phải lớn hơn số đứng trước."
                    },
                    new Question
                    {
                        LessonId = lesson2.Id,
                        Content = "Điền dấu thích hợp: 2 + 3 ... 6",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Khó",
                        CorrectAnswer = "<",
                        Hint = "Tính 2 + 3 = 5 trước, sau đó so sánh 5 với 6."
                    }
                };
                context.Questions.AddRange(questionsL2);
                await context.SaveChangesAsync();
            }

            // Chủ đề 2: Phép cộng và trừ trong phạm vi 10
            var topic2 = await context.Topics.FirstOrDefaultAsync(t => t.Name == "Phép cộng và trừ trong phạm vi 10" && t.GradeLevel == 1);
            if (topic2 == null)
            {
                topic2 = new Topic
                {
                    GradeLevel = 1,
                    Name = "Phép cộng và trừ trong phạm vi 10",
                    Description = "Làm quen với các phép tính cộng thêm và bớt đi trong phạm vi 10"
                };
                context.Topics.Add(topic2);
                await context.SaveChangesAsync();
            }

            var lessonCong5 = await context.Lessons.FirstOrDefaultAsync(l => l.TopicId == topic2.Id && l.Title == "Phép cộng trong phạm vi 5");
            if (lessonCong5 == null)
            {
                lessonCong5 = new Lesson { TopicId = topic2.Id, Title = "Phép cộng trong phạm vi 5", OrderIndex = 1 };
                context.Lessons.Add(lessonCong5);
                await context.SaveChangesAsync();

                var questionsCong = new List<Question>
                {
                    new Question
                    {
                        LessonId = lessonCong5.Id,
                        Content = "Kết quả của phép tính: 2 + 1 = ?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Dễ",
                        OptionA = "2", OptionB = "3", OptionC = "4", OptionD = "5",
                        CorrectAnswer = "3",
                        Hint = "Có 2 que tính, thêm 1 que tính nữa là mấy?"
                    },
                    new Question
                    {
                        LessonId = lessonCong5.Id,
                        Content = "Tính: 3 + 2 = ?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Dễ",
                        CorrectAnswer = "5",
                        Hint = "Đếm tiếp từ 3 thêm 2 đơn vị: 4, 5."
                    },
                    new Question
                    {
                        LessonId = lessonCong5.Id,
                        Content = "Bạn Lan có 1 bông hoa, mẹ cho thêm 3 bông hoa. Hỏi Lan có tất cả bao nhiêu bông hoa?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Trung bình",
                        OptionA = "3", OptionB = "4", OptionC = "5", OptionD = "2",
                        CorrectAnswer = "4",
                        Hint = "Phép tính: 1 + 3 = 4."
                    },
                    new Question
                    {
                        LessonId = lessonCong5.Id,
                        Content = "Điền số vào ô trống: ... + 2 = 4",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Trung bình",
                        CorrectAnswer = "2",
                        Hint = "Mấy cộng với 2 thì bằng 4?"
                    },
                    new Question
                    {
                        LessonId = lessonCong5.Id,
                        Content = "Phép tính nào sau đây có kết quả bằng 5?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Khó",
                        OptionA = "1 + 2", OptionB = "2 + 2", OptionC = "4 + 1", OptionD = "3 + 1",
                        CorrectAnswer = "4 + 1",
                        Hint = "Thử tính từng phép tính: 4 + 1 = 5."
                    },
                    new Question
                    {
                        LessonId = lessonCong5.Id,
                        Content = "Tính: 1 + 2 + 2 = ?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Khó",
                        CorrectAnswer = "5",
                        Hint = "Thực hiện từ trái sang phải: 1 + 2 = 3, sau đó 3 + 2 = ?"
                    }
                };
                context.Questions.AddRange(questionsCong);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedGrade2Async(EduPlayDbContext context)
        {
            var topicG2 = await context.Topics.FirstOrDefaultAsync(t => t.Name == "Bảng nhân và bảng chia 2, 5" && t.GradeLevel == 2);
            if (topicG2 == null)
            {
                topicG2 = new Topic
                {
                    GradeLevel = 2,
                    Name = "Bảng nhân và bảng chia 2, 5",
                    Description = "Làm quen với phép nhân và bảng chia qua các bài toán chia đều vui nhộn"
                };
                context.Topics.Add(topicG2);
                await context.SaveChangesAsync();
            }

            var lessonNhan2 = await context.Lessons.FirstOrDefaultAsync(l => l.TopicId == topicG2.Id && l.Title == "Bảng nhân 2 và nhân 5");
            if (lessonNhan2 == null)
            {
                lessonNhan2 = new Lesson { TopicId = topicG2.Id, Title = "Bảng nhân 2 và nhân 5", OrderIndex = 1 };
                context.Lessons.Add(lessonNhan2);
                await context.SaveChangesAsync();

                var questions = new List<Question>
                {
                    new Question
                    {
                        LessonId = lessonNhan2.Id,
                        Content = "Tính kết quả: 2 x 4 = ?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Dễ",
                        OptionA = "6", OptionB = "8", OptionC = "10", OptionD = "12",
                        CorrectAnswer = "8",
                        Hint = "2 được lấy 4 lần: 2 + 2 + 2 + 2 = 8."
                    },
                    new Question
                    {
                        LessonId = lessonNhan2.Id,
                        Content = "Tính: 5 x 3 = ?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Dễ",
                        CorrectAnswer = "15",
                        Hint = "5 x 3 = 15."
                    },
                    new Question
                    {
                        LessonId = lessonNhan2.Id,
                        Content = "Mỗi con thỏ có 2 cái tai. Hỏi 6 con thỏ có tất cả bao nhiêu cái tai?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Trung bình",
                        OptionA = "10", OptionB = "12", OptionC = "14", OptionD = "16",
                        CorrectAnswer = "12",
                        Hint = "Phép tính nhân: 2 x 6 = 12 cái tai."
                    },
                    new Question
                    {
                        LessonId = lessonNhan2.Id,
                        Content = "Điền số thích hợp: 5 x ... = 25",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Trung bình",
                        CorrectAnswer = "5",
                        Hint = "5 nhân với mấy để được 25?"
                    },
                    new Question
                    {
                        LessonId = lessonNhan2.Id,
                        Content = "Có 5 túi kẹo, mỗi túi có 4 viên kẹo. Sau khi bé Bo ăn 2 viên, hỏi còn lại bao nhiêu viên kẹo?",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Khó",
                        OptionA = "18", OptionB = "20", OptionC = "22", OptionD = "16",
                        CorrectAnswer = "18",
                        Hint = "Tổng số kẹo là: 5 x 4 = 20 viên. Ăn 2 viên: 20 - 2 = 18 viên."
                    },
                    new Question
                    {
                        LessonId = lessonNhan2.Id,
                        Content = "Tính giá trị biểu thức: 2 x 9 + 15 = ?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Khó",
                        CorrectAnswer = "33",
                        Hint = "Thực hiện phép nhân trước: 2 x 9 = 18, sau đó 18 + 15 = ?"
                    }
                };
                context.Questions.AddRange(questions);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedGrade3Async(EduPlayDbContext context)
        {
            var topicG3 = await context.Topics.FirstOrDefaultAsync(t => t.Name == "Hình học: Chu vi và Diện tích" && t.GradeLevel == 3);
            if (topicG3 == null)
            {
                topicG3 = new Topic
                {
                    GradeLevel = 3,
                    Name = "Hình học: Chu vi và Diện tích",
                    Description = "Khám phá cách tính chu vi và diện tích các hình phẳng cơ bản"
                };
                context.Topics.Add(topicG3);
                await context.SaveChangesAsync();
            }

            var lessonChuVi = await context.Lessons.FirstOrDefaultAsync(l => l.TopicId == topicG3.Id && l.Title == "Chu vi hình vuông và hình chữ nhật");
            if (lessonChuVi == null)
            {
                lessonChuVi = new Lesson { TopicId = topicG3.Id, Title = "Chu vi hình vuông và hình chữ nhật", OrderIndex = 1 };
                context.Lessons.Add(lessonChuVi);
                await context.SaveChangesAsync();

                var questions = new List<Question>
                {
                    new Question
                    {
                        LessonId = lessonChuVi.Id,
                        Content = "Một hình vuông có cạnh dài 5cm. Chu vi của hình vuông đó là:",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Dễ",
                        OptionA = "15cm", OptionB = "20cm", OptionC = "25cm", OptionD = "10cm",
                        CorrectAnswer = "20cm",
                        Hint = "Muốn tính chu vi hình vuông, ta lấy độ dài một cạnh nhân với 4: 5 x 4 = 20cm."
                    },
                    new Question
                    {
                        LessonId = lessonChuVi.Id,
                        Content = "Tính chu vi hình vuông có cạnh bằng 6cm (nhập số kết quả):",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Dễ",
                        CorrectAnswer = "24",
                        Hint = "Chu vi hình vuông = Cạnh x 4: 6 x 4 = 24."
                    },
                    new Question
                    {
                        LessonId = lessonChuVi.Id,
                        Content = "Hình chữ nhật có chiều dài 8cm, chiều rộng 4cm. Chu vi hình chữ nhật là:",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Trung bình",
                        OptionA = "24cm", OptionB = "12cm", OptionC = "32cm", OptionD = "16cm",
                        CorrectAnswer = "24cm",
                        Hint = "Chu vi hình chữ nhật = (Dài + Rộng) x 2 = (8 + 4) x 2 = 24cm."
                    },
                    new Question
                    {
                        LessonId = lessonChuVi.Id,
                        Content = "Một mảnh vườn hình vuông có chu vi là 36m. Hỏi cạnh của mảnh vườn đó dài bao nhiêu mét?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Trung bình",
                        CorrectAnswer = "9",
                        Hint = "Cạnh hình vuông = Chu vi chia cho 4: 36 : 4 = 9m."
                    },
                    new Question
                    {
                        LessonId = lessonChuVi.Id,
                        Content = "Một hình chữ nhật có chu vi là 30cm, biết chiều rộng là 5cm. Chiều dài của hình chữ nhật đó là:",
                        QuestionType = "Trắc nghiệm",
                        DifficultyLevel = "Khó",
                        OptionA = "10cm", OptionB = "15cm", OptionC = "20cm", OptionD = "25cm",
                        CorrectAnswer = "10cm",
                        Hint = "Nửa chu vi = 30 : 2 = 15cm. Chiều dài = 15 - 5 = 10cm."
                    },
                    new Question
                    {
                        LessonId = lessonChuVi.Id,
                        Content = "Bác An muốn rào một khu vườn hình chữ nhật có chiều dài 12m, chiều rộng 8m. Để lại cửa ra vào rộng 2m. Hỏi chiều dài hàng rào bác An cần làm là bao nhiêu mét?",
                        QuestionType = "Điền đáp án",
                        DifficultyLevel = "Khó",
                        CorrectAnswer = "38",
                        Hint = "Chu vi vườn: (12 + 8) x 2 = 40m. Chiều dài hàng rào trừ đi cửa: 40 - 2 = 38m."
                    }
                };
                context.Questions.AddRange(questions);
                await context.SaveChangesAsync();
            }
        }
    }
}
