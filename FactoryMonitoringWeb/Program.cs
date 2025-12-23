using FactoryMonitoringWeb.Data;
using FactoryMonitoringWeb.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// =====================
// Services
// =====================

// MVC + JSON settings
builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling =
            Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.NullValueHandling =
            Newtonsoft.Json.NullValueHandling.Ignore;
        // Use camelCase for JSON property names (JavaScript convention)
        options.SerializerSettings.ContractResolver = 
            new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
    });

// DbContext
builder.Services.AddDbContext<FactoryDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS (for API + Agent communication)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Session
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// ISSUE 5 FIX: Add HttpContextAccessor for getting base URL
builder.Services.AddHttpContextAccessor();

// ISSUE 5 FIX: Add Heartbeat Monitor Background Service
builder.Services.AddHostedService<HeartbeatMonitorService>();

var app = builder.Build();

// =====================
// Middleware pipeline
// =====================

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Disable HTTPS redirection in development for easier testing
// app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowAll");

app.UseAuthorization();
app.UseSession();

// MVC routes (Razor Pages / Views)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// API Controllers
app.MapControllers();

app.Run();