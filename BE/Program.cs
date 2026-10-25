using BE.Data; 
using BE.Services;
using Microsoft.EntityFrameworkCore; 
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Thêm dịch vụ Controllers
builder.Services.AddControllers();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<StudentService>();
builder.Services.AddScoped<ParentService>();
builder.Services.AddHttpClient<QuestionService>();
builder.Services.AddScoped<ReportService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// 2. Cấu hình CORS cho phép ReactJS gọi API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactFE", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Cho phép mọi cổng localhost của React/Vite (5173, 5174, 3000...)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 3. Kết nối DbContext với SQL Server
builder.Services.AddDbContext<EduPlayDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Cấu hình Swagger/OpenAPI (để test API trên trình duyệt)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi(); // .NET 9 hỗ trợ OpenApi

var app = builder.Build();

// Seed dữ liệu mẫu khi khởi động (Migrations cần chạy trước bằng: dotnet ef database update)
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<EduPlayDbContext>();

        // Khởi tạo dữ liệu mẫu phong phú cho hệ thống (badges, tài khoản, chương trình học...)
        DbSeeder.SeedSampleDataAsync(dbContext).GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Lỗi khi Seeding dữ liệu mẫu. Hãy đảm bảo đã chạy: dotnet ef database update");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    
    // Bổ sung hiển thị giao diện Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Chỉ kích hoạt HttpsRedirection khi không phải môi trường Development
// Tránh lỗi trình duyệt tự động chặn kết nối HTTP localhost hoặc lỗi chứng chỉ SSL
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Kích hoạt CORS đã cài đặt ở trên (Lưu ý: Đặt trước UseAuthorization)
app.UseCors("AllowReactFE"); 

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();