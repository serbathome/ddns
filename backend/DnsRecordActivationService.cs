using backend;
using Microsoft.EntityFrameworkCore;

public class DnsRecordActivationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly AzureDnsService _azureDnsService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DnsRecordActivationService> _logger;
    private readonly PeriodicTimer _timer = new(TimeSpan.FromMinutes(5));

    public DnsRecordActivationService(
        IServiceProvider serviceProvider,
        AzureDnsService azureDnsService,
        IConfiguration configuration,
        ILogger<DnsRecordActivationService> logger)
    {
        _serviceProvider = serviceProvider;
        _azureDnsService = azureDnsService;
        _configuration = configuration;
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

            // Get TTL from configuration (default to 3600 seconds = 1 hour)
            var ttlSeconds = _configuration.GetValue<int>("RecordTTL", 3600);
            var ttlThreshold = DateTime.UtcNow.AddSeconds(-ttlSeconds);

            // Check for expired active/refreshed records
            var expiredRecords = await db.Records
                .Where(r => (r.Status == "active" || r.Status == "refreshed") && r.LastUpdatedAt < ttlThreshold)
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {Count} expired records to mark as inactive", expiredRecords.Count);

            // Mark expired records as inactive
            foreach (var record in expiredRecords)
            {
                record.Status = "inactive";
                await db.SaveChangesAsync(stoppingToken);
                
                _logger.LogInformation(
                    "Marked record as inactive due to TTL expiration: ID={Id}, Hostname={Hostname}, LastUpdated={LastUpdated}",
                    record.Id,
                    record.Hostname,
                    record.LastUpdatedAt);
            }

            // Fetch all records with status="added" or "updated"
            var recordsToActivate = await db.Records
                .Where(r => r.Status == "added" || r.Status == "updated")
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {Count} records to activate", recordsToActivate.Count);

            // Fetch all inactive records to delete from Azure DNS
            var recordsToDelete = await db.Records
                .Where(r => r.Status == "inactive")
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {Count} records to delete from Azure DNS", recordsToDelete.Count);

            // Delete inactive records from Azure DNS
            foreach (var record in recordsToDelete)
            {
                var deleted = await _azureDnsService.DeleteARecordAsync(record.Hostname);
                if (deleted)
                {
                    // Remove from database after successful deletion from Azure
                    db.Records.Remove(record);
                    await db.SaveChangesAsync(stoppingToken);
                    
                    _logger.LogInformation(
                        "Deleted DNS record from Azure and DB: ID={Id}, Hostname={Hostname}",
                        record.Id,
                        record.Hostname);
                }
                else
                {
                    _logger.LogWarning(
                        "Failed to delete DNS record from Azure, will retry: ID={Id}, Hostname={Hostname}",
                        record.Id,
                        record.Hostname);
                }
            }

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
