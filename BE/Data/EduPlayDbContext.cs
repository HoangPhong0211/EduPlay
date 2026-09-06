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
            
            // 2. Cấu hình quan hệ 1-1: Bảng USERS mở rộng thành STUDENTS
            modelBuilder.Entity<Student>()
                .HasKey(s => s.UserId); // Set UserId làm Khóa chính (PK)

            // 3. Cấu hình quan hệ 1-N: Phụ huynh quản lý nhiều Học sinh
            modelBuilder.Entity<Student>()
                .HasOne<Parent>() 
                .WithMany() 
                .HasForeignKey(s => s.ParentId)
                .OnDelete(DeleteBehavior.Restrict); // Ngăn xóa Phụ huynh nếu còn Học sinh để tránh lỗi dữ liệu

            // 4. Cấu hình quan hệ N-N: Học sinh - Huy hiệu (Bảng trung gian StudentBadge)
            modelBuilder.Entity<StudentBadge>()
                .HasKey(sb => new { sb.StudentId, sb.BadgeId }); // Khóa chính kết hợp 2 cột
        }
    }
}