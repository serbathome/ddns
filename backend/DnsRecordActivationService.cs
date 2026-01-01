using backend;
using Microsoft.EntityFrameworkCore;

public class DnsRecordActivationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly AzureDnsService _azureDnsService;
    private readonly ILogger<DnsRecordActivationService> _logger;
    private readonly PeriodicTimer _timer = new(TimeSpan.FromMinutes(5));

    public DnsRecordActivationService(
        IServiceProvider serviceProvider,
        AzureDnsService azureDnsService,
        ILogger<DnsRecordActivationService> logger)
    {
        _serviceProvider = serviceProvider;
        _azureDnsService = azureDnsService;
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

            // Fetch all records with status="added" or "updated"
            var recordsToActivate = await db.Records
                .Where(r => r.Status == "added" || r.Status == "updated")
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {Count} records to activate", recordsToActivate.Count);

            // Update each record individually
            foreach (var record in recordsToActivate)
            {
                // Create or update DNS record in Azure
                var azureSuccess = await _azureDnsService.CreateOrUpdateARecordAsync(
                    record.Hostname, 
                    record.IpAddress);

                if (azureSuccess)
                {
                    // If hostname changed, delete the old DNS record after new one is created
                    if (!string.IsNullOrEmpty(record.OldHostname))
                    {
                        await _azureDnsService.DeleteARecordAsync(record.OldHostname);
                        record.OldHostname = null; // Clear after deletion
                    }

                    // Only update status in DB if Azure DNS operation succeeded
                    record.Status = "active";
                    await db.SaveChangesAsync(stoppingToken);

                    _logger.LogInformation(
                        "Activated DNS record in Azure and DB: ID={Id}, Hostname={Hostname}, IpAddress={IpAddress}",
                        record.Id,
                        record.Hostname,
                        record.IpAddress);
                }
                else
                {
                    _logger.LogWarning(
                        "Failed to create Azure DNS record, keeping status as 'added': ID={Id}, Hostname={Hostname}",
                        record.Id,
                        record.Hostname);
                }
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
