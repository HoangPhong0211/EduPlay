using Microsoft.EntityFrameworkCore;
using BE.Models; // Thay BE bằng namespace thực tế của bạn nếu khác

namespace BE.Data
{
    public class EduPlayDbContext : DbContext
    {
        public EduPlayDbContext(DbContextOptions<EduPlayDbContext> options) : base(options) { }

        // Khai báo các bảng (DbSet)
        public DbSet<User> Users { get; set; }
        public DbSet<Parent> Parents { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Topic> Topics { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<ErrorLog> ErrorLogs { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Badge> Badges { get; set; }
        public DbSet<StudentBadge> StudentBadges { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Cấu hình quan hệ 1-1: Bảng USERS mở rộng thành PARENTS
            modelBuilder.Entity<Parent>()
                .HasKey(p => p.UserId); // Set UserId làm Khóa chính (PK)
            modelBuilder.Entity<Parent>()
                .Property(p => p.UserId)
                .ValueGeneratedNever(); // Khóa chính lấy từ User.Id, không sinh tự động (IDENTITY)
            modelBuilder.Entity<Parent>()
                .HasOne<User>()
                .WithOne()
                .HasForeignKey<Parent>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // 2. Cấu hình quan hệ 1-1: Bảng USERS mở rộng thành STUDENTS
            modelBuilder.Entity<Student>()
                .HasKey(s => s.UserId); // Set UserId làm Khóa chính (PK)
            modelBuilder.Entity<Student>()
                .Property(s => s.UserId)
                .ValueGeneratedNever(); // Khóa chính lấy từ User.Id, không sinh tự động (IDENTITY)
            modelBuilder.Entity<Student>()
                .HasOne<User>()
                .WithOne()
                .HasForeignKey<Student>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 3. Cấu hình quan hệ 1-N: Phụ huynh quản lý nhiều Học sinh
            modelBuilder.Entity<Student>()
                .HasOne<Parent>() 
                .WithMany() 
                .HasForeignKey(s => s.ParentId)
                .OnDelete(DeleteBehavior.Restrict); // Ngăn xóa Phụ huynh nếu còn Học sinh để tránh lỗi dữ liệu

            // 4. Cấu hình quan hệ 1-N: Assignment thuộc về Parent, Student và Lesson
            modelBuilder.Entity<Assignment>()
                .HasOne<Parent>()
                .WithMany()
                .HasForeignKey(a => a.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Assignment>()
                .HasOne<Student>()
                .WithMany()
                .HasForeignKey(a => a.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Assignment>()
                .HasOne<Lesson>()
                .WithMany()
                .HasForeignKey(a => a.LessonId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Question>()
                .HasOne<Lesson>()
                .WithMany()
                .HasForeignKey(q => q.LessonId)
                .OnDelete(DeleteBehavior.Restrict);

            // 5. Cấu hình quan hệ N-N: Học sinh - Huy hiệu (Bảng trung gian StudentBadge)
            modelBuilder.Entity<StudentBadge>()
                .HasKey(sb => new { sb.StudentId, sb.BadgeId }); // Khóa chính kết hợp 2 cột

            modelBuilder.Entity<ErrorLog>()
                .HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ErrorLog>()
                .HasOne(e => e.Question)
                .WithMany()
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Cấu hình quan hệ 1-N: Topic có nhiều Lesson
            modelBuilder.Entity<Lesson>()
                .HasOne(l => l.Topic)
                .WithMany(t => t.Lessons)
                .HasForeignKey(l => l.TopicId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}