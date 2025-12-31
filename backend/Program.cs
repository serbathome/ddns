using backend;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add SQLite database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add background service for DNS record activation
builder.Services.AddHostedService<DnsRecordActivationService>();

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.MapGet("/health", () => Results.Ok())
    .WithName("Health");

app.MapPost("/api/user", async (CreateUserRequest request, AppDbContext db) =>
{
    // Check if user already exists
    var existingUser = await db.Users.FirstOrDefaultAsync(u => u.UserEmail == request.Email);
    if (existingUser != null)
    {
        return Results.StatusCode(500);
    }

    // Generate random token
    var token = Guid.NewGuid().ToString("N");

    // Create new user
    var user = new User
    {
        UserEmail = request.Email,
        Token = token
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Ok(new { token });
})
.WithName("CreateUser");

app.MapPost("/api/login", async (LoginRequest request, AppDbContext db) =>
{
    // Validate if user exists with the provided email and token
    var user = await db.Users.FirstOrDefaultAsync(u => u.UserEmail == request.Email && u.Token == request.Token);
    
    if (user == null)
    {
        return Results.StatusCode(403);
    }

    return Results.Ok();
})
.WithName("Login");

app.MapPost("/api/dns", async (DnsRecordRequest request, AppDbContext db) =>
{
    // Validate token exists
    var user = await db.Users.FirstOrDefaultAsync(u => u.Token == request.Token);
    if (user == null)
    {
        return Results.StatusCode(403);
    }

    // Check if record already exists
    var existingRecord = await db.Records.FirstOrDefaultAsync(r => 
        //r.Token == request.Token && 
        r.Hostname == request.Hostname);
    
    if (existingRecord != null)
    {
        return Results.StatusCode(500);
    }

    // Add new record with status "added"
    var record = new Record
    {
        Token = request.Token,
        IpAddress = request.IpAddress,
        Hostname = request.Hostname,
        Status = "added",
        LastUpdatedAt = DateTime.UtcNow
    };

    db.Records.Add(record);
    await db.SaveChangesAsync();

    return Results.Ok();
})
.WithName("AddDnsRecord");

app.MapGet("/api/dns", async (string token, AppDbContext db) =>
{
    // Validate token exists
    var user = await db.Users.FirstOrDefaultAsync(u => u.Token == token);
    if (user == null)
    {
        return Results.StatusCode(403);
    }

    // Get all records for the token
    var records = await db.Records
        .Where(r => r.Token == token)
        .Select(r => new
        {
            r.Id,
            r.IpAddress,
            r.Hostname,
            r.Status,
            r.LastUpdatedAt
        })
        .ToListAsync();

    return Results.Ok(records);
})
.WithName("GetDnsRecords");

app.MapDelete("/api/dns/{id}", async (int id, string token, AppDbContext db) =>
{
    // Validate token exists
    var user = await db.Users.FirstOrDefaultAsync(u => u.Token == token);
    if (user == null)
    {
        return Results.StatusCode(403);
    }

    // Find the record by ID and ensure it belongs to this user
    var record = await db.Records.FirstOrDefaultAsync(r => r.Id == id && r.Token == token);
    
    if (record == null)
    {
        return Results.NotFound();
    }

    db.Records.Remove(record);
    await db.SaveChangesAsync();

    return Results.Ok();
})
.WithName("DeleteDnsRecord");

app.MapPatch("/api/dns/{id}", async (int id, UpdateDnsRecordRequest request, AppDbContext db) =>
{
    // Validate token exists
    var user = await db.Users.FirstOrDefaultAsync(u => u.Token == request.Token);
    if (user == null)
    {
        return Results.StatusCode(403);
    }

    // Find the record by ID and ensure it belongs to this user
    var record = await db.Records.FirstOrDefaultAsync(r => r.Id == id && r.Token == request.Token);
    
    if (record == null)
    {
        return Results.NotFound();
    }

    // Update record fields
    if (!string.IsNullOrEmpty(request.IpAddress))
    {
        record.IpAddress = request.IpAddress;
    }
    
    if (!string.IsNullOrEmpty(request.Hostname))
    {
        // Check if new hostname already exists (excluding current record)
        var existingRecord = await db.Records.FirstOrDefaultAsync(r => 
            r.Hostname == request.Hostname && r.Id != id);
        
        if (existingRecord != null)
        {
            return Results.StatusCode(500);
        }
        
        record.Hostname = request.Hostname;
    }
    record.Status = "updated";
    record.LastUpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok();
})
.WithName("UpdateDnsRecord");

app.MapPost("/api/dns/refresh", async (RefreshDnsRecordRequest request, AppDbContext db) =>
{
    // Find the record with matching token, IP address, hostname, and status="active"
    var record = await db.Records.FirstOrDefaultAsync(r => 
        r.Token == request.Token && 
        r.IpAddress == request.IpAddress && 
        r.Hostname == request.Hostname && 
        r.Status == "active");
    
    if (record == null)
    {
        return Results.NotFound();
    }

    // Update status to "refreshed"
    record.Status = "refreshed";
    record.LastUpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok();
})
.WithName("RefreshDnsRecord");

app.Run();

record CreateUserRequest(string Email);
record LoginRequest(string Email, string Token);
record DnsRecordRequest(string Token, string IpAddress, string Hostname);
record UpdateDnsRecordRequest(string Token, string? IpAddress, string? Hostname);
record RefreshDnsRecordRequest(string Token, string IpAddress, string Hostname);
