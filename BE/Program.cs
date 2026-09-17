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
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173") // Port mặc định của React (Create React App hoặc Vite)
              .AllowAnyHeader()
              .AllowAnyMethod();
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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    
    // Bổ sung hiển thị giao diện Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Kích hoạt CORS đã cài đặt ở trên (Lưu ý: Đặt trước UseAuthorization)
app.UseCors("AllowReactFE"); 

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();