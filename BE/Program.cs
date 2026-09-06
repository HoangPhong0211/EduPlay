using BE.Data; 
using Microsoft.EntityFrameworkCore; 

var builder = WebApplication.CreateBuilder(args);

// 1. Thêm dịch vụ Controllers
builder.Services.AddControllers();

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

app.UseAuthorization();
app.MapControllers();

app.Run();