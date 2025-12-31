using backend;
using Microsoft.EntityFrameworkCore;

public class DnsRecordActivationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DnsRecordActivationService> _logger;
    private readonly PeriodicTimer _timer = new(TimeSpan.FromMinutes(5));

    public DnsRecordActivationService(
        IServiceProvider serviceProvider,
        ILogger<DnsRecordActivationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DNS Record Activation Service started");

        while (!stoppingToken.IsCancellationRequested && await _timer.WaitForNextTickAsync(stoppingToken))
        {
            await ActivateRecordsAsync(stoppingToken);
        }

        _logger.LogInformation("DNS Record Activation Service stopped");
    }

    private async Task ActivateRecordsAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting DNS record activation run at {Time}", DateTime.UtcNow);

        try
        {
            // Create a new scope to get a scoped DbContext
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Fetch all records with status="added"
            var recordsToActivate = await db.Records
                .Where(r => r.Status == "added")
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {Count} records to activate", recordsToActivate.Count);

            // Update each record individually
            foreach (var record in recordsToActivate)
            {
                record.Status = "active";
                await db.SaveChangesAsync(stoppingToken);

                _logger.LogInformation(
                    "Activated DNS record: ID={Id}, Hostname={Hostname}, IpAddress={IpAddress}",
                    record.Id,
                    record.Hostname,
                    record.IpAddress);
            }

            _logger.LogInformation("Completed DNS record activation run. Total activated: {Count}", recordsToActivate.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during DNS record activation");
        }
    }

    public override void Dispose()
    {
        _timer.Dispose();
        base.Dispose();
    }
}
