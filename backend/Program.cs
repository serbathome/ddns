using backend;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add CORS
var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:5173";
var origins = allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(origins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add SQLite database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Azure DNS service
builder.Services.AddSingleton<AzureDnsService>();

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

//app.UseHttpsRedirection();

// Helper method to extract token from Authorization header
static string? ExtractTokenFromHeader(HttpContext context)
{
    var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader))
        return null;
    
    // Expected format: "Bearer {token}"
    if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        return authHeader.Substring(7);
    
    return null;
}

// Helper method to validate hostname according to DNS standards
static (bool isValid, string? errorMessage) ValidateHostname(string hostname)
{
    if (string.IsNullOrWhiteSpace(hostname))
        return (false, "Hostname cannot be empty");

    // Trim whitespace
    hostname = hostname.Trim();

    // Check for reserved/forbidden values
    if (hostname.Equals("api", StringComparison.OrdinalIgnoreCase))
        return (false, "Hostname 'api' is reserved and cannot be used");
    
    if (hostname.Contains("@"))
        return (false, "Hostname cannot contain '@' symbol (apex records not supported)");
    
    if (hostname.Contains("."))
        return (false, "Hostname cannot contain dots - use only the subdomain name");

    // RFC 1123 compliance: hostname labels
    // - Must be between 1 and 63 characters
    // - Can only contain alphanumeric characters and hyphens
    // - Cannot start or end with a hyphen
    // - Cannot be all numeric
    
    if (hostname.Length < 1 || hostname.Length > 63)
        return (false, "Hostname must be between 1 and 63 characters");

    if (hostname.StartsWith("-") || hostname.EndsWith("-"))
        return (false, "Hostname cannot start or end with a hyphen");

    // Check if contains only valid characters (alphanumeric and hyphen)
    if (!System.Text.RegularExpressions.Regex.IsMatch(hostname, @"^[a-zA-Z0-9-]+$"))
        return (false, "Hostname can only contain letters, numbers, and hyphens");

    // Check if all numeric (not allowed for hostnames)
    if (System.Text.RegularExpressions.Regex.IsMatch(hostname, @"^[0-9]+$"))
        return (false, "Hostname cannot be entirely numeric");

    return (true, null);
}

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("HealthCheck");

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

app.MapPost("/api/dns", async (DnsRecordRequest request, HttpContext context, AppDbContext db) =>
{
    // Extract and validate token from Authorization header
    var token = ExtractTokenFromHeader(context);
    if (string.IsNullOrEmpty(token))
    {
        return Results.StatusCode(403);
    }

    var user = await db.Users.FirstOrDefaultAsync(u => u.Token == token);
    if (user == null)
    {
        return Results.StatusCode(403);
    }

    // Validate hostname
    var (isValid, errorMessage) = ValidateHostname(request.Hostname);
    if (!isValid)
    {
        return Results.BadRequest(new { error = errorMessage });
    }

    // Check if record already exists
    var existingRecord = await db.Records.FirstOrDefaultAsync(r => 
        //r.Token == token && 
        r.Hostname == request.Hostname);
    
    if (existingRecord != null)
    {
        return Results.StatusCode(500);
    }

    // Add new record with status "added"
    var record = new Record
    {
        Token = token,
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

app.MapGet("/api/dns", async (HttpContext context, AppDbContext db) =>
{
    // Extract and validate token from Authorization header
    var token = ExtractTokenFromHeader(context);
    if (string.IsNullOrEmpty(token))
    {
        return Results.StatusCode(403);
    }

    var user = await db.Users.FirstOrDefaultAsync(u => u.Token == token);
    if (user == null)
    {
        return Results.StatusCode(403);
    }

    // Get all records for the token
    var records = await db.Records
        .Where(r => r.Token == token && r.Status != "inactive")
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

app.MapDelete("/api/dns/{id}", async (int id, HttpContext context, AppDbContext db) =>
{
    // Extract and validate token from Authorization header
    var token = ExtractTokenFromHeader(context);
    if (string.IsNullOrEmpty(token))
    {
        return Results.StatusCode(403);
    }

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

    // Soft delete: mark as inactive instead of removing
    record.Status = "inactive";
    record.LastUpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok();
})
.WithName("DeleteDnsRecord");

app.MapPatch("/api/dns/{id}", async (int id, UpdateDnsRecordRequest request, HttpContext context, AppDbContext db) =>
{
    // Extract and validate token from Authorization header
    var token = ExtractTokenFromHeader(context);
    if (string.IsNullOrEmpty(token))
    {
        return Results.StatusCode(403);
    }

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

    // Update record fields
    if (!string.IsNullOrEmpty(request.IpAddress))
    {
        record.IpAddress = request.IpAddress;
    }
    
    if (!string.IsNullOrEmpty(request.Hostname))
    {
        // Validate hostname
        var (isValid, errorMessage) = ValidateHostname(request.Hostname);
        if (!isValid)
        {
            return Results.BadRequest(new { error = errorMessage });
        }

        // Check if new hostname already exists (excluding current record)
        var existingRecord = await db.Records.FirstOrDefaultAsync(r => 
            r.Hostname == request.Hostname && r.Id != id);
        
        if (existingRecord != null)
        {
            return Results.StatusCode(500);
        }
        
        // Store old hostname for cleanup
        if (record.Hostname != request.Hostname)
        {
            record.OldHostname = record.Hostname;
        }
        record.Hostname = request.Hostname;
    }
    record.Status = "updated";
    record.LastUpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok();
})
.WithName("UpdateDnsRecord");

app.MapPost("/api/dns/refresh", async (RefreshDnsRecordRequest request, HttpContext context, AppDbContext db) =>
{
    // Extract token from Authorization header first, fallback to request body
    var token = ExtractTokenFromHeader(context);
    if (string.IsNullOrEmpty(token))
    {
        token = request.Token;
    }
    
    if (string.IsNullOrEmpty(token))
    {
        return Results.StatusCode(403);
    }

    // Validate hostname
    var (isValid, errorMessage) = ValidateHostname(request.Hostname);
    if (!isValid)
    {
        return Results.BadRequest(new { error = errorMessage });
    }

    // Find the record with matching token, IP address, hostname, and status="active"
    var record = await db.Records.FirstOrDefaultAsync(r => 
        r.Token == token && 
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
record DnsRecordRequest(string IpAddress, string Hostname);
record UpdateDnsRecordRequest(string? IpAddress, string? Hostname);
record RefreshDnsRecordRequest(string IpAddress, string Hostname, string? Token = null);
