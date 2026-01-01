using Azure.Core;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Dns;
using Azure.ResourceManager.Dns.Models;
using Azure.ResourceManager.Resources;

namespace backend;

public class AzureDnsService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AzureDnsService> _logger;
    private readonly ArmClient _armClient;
    private readonly string _zoneName;
    private readonly string _resourceGroupName;
    private readonly string _subscriptionId;

    public AzureDnsService(IConfiguration configuration, ILogger<AzureDnsService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Get configuration values
        _zoneName = _configuration["AzureDns:ZoneName"] 
            ?? throw new InvalidOperationException("AzureDns:ZoneName is not configured");
        _resourceGroupName = _configuration["AzureDns:ResourceGroupName"] 
            ?? throw new InvalidOperationException("AzureDns:ResourceGroupName is not configured");
        _subscriptionId = _configuration["AzureDns:SubscriptionId"] 
            ?? throw new InvalidOperationException("AzureDns:SubscriptionId is not configured");

        // Initialize ARM client with DefaultAzureCredential (supports managed identity)
        _armClient = new ArmClient(new DefaultAzureCredential());
        
        _logger.LogInformation(
            "AzureDnsService initialized for zone {ZoneName} in resource group {ResourceGroup}", 
            _zoneName, _resourceGroupName);
    }

    /// <summary>
    /// Creates or updates an A record in the Azure DNS zone
    /// </summary>
    public async Task<bool> CreateOrUpdateARecordAsync(string hostname, string ipAddress)
    {
        try
        {
            _logger.LogInformation(
                "Creating/updating DNS A record: {Hostname} -> {IpAddress}", 
                hostname, ipAddress);

            // Get subscription
            var subscription = await _armClient.GetSubscriptionResource(
                new ResourceIdentifier($"/subscriptions/{_subscriptionId}")
            ).GetAsync();

            // Get resource group
            var resourceGroup = await subscription.Value.GetResourceGroups()
                .GetAsync(_resourceGroupName);

            // Get DNS zone
            var dnsZone = await resourceGroup.Value.GetDnsZones()
                .GetAsync(_zoneName);

            // Create or update A record
            var aRecordData = new DnsARecordData
            {
                TtlInSeconds = 3600 // 1 hour TTL
            };
            aRecordData.DnsARecords.Add(new DnsARecordInfo
            {
                IPv4Address = System.Net.IPAddress.Parse(ipAddress)
            });

            var aRecordCollection = dnsZone.Value.GetDnsARecords();
            await aRecordCollection.CreateOrUpdateAsync(
                Azure.WaitUntil.Completed,
                hostname,
                aRecordData
            );

            _logger.LogInformation(
                "Successfully created/updated DNS A record: {Hostname}.{Zone} -> {IpAddress}",
                hostname, _zoneName, ipAddress);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Failed to create/update DNS A record: {Hostname} -> {IpAddress}", 
                hostname, ipAddress);
            return false;
        }
    }

    /// <summary>
    /// Deletes an A record from the Azure DNS zone
    /// </summary>
    public async Task<bool> DeleteARecordAsync(string hostname)
    {
        try
        {
            _logger.LogInformation("Deleting DNS A record: {Hostname}", hostname);

            // Get subscription
            var subscription = await _armClient.GetSubscriptionResource(
                new ResourceIdentifier($"/subscriptions/{_subscriptionId}")
            ).GetAsync();

            // Get resource group
            var resourceGroup = await subscription.Value.GetResourceGroups()
                .GetAsync(_resourceGroupName);

            // Get DNS zone
            var dnsZone = await resourceGroup.Value.GetDnsZones()
                .GetAsync(_zoneName);

            // Delete A record
            var aRecordCollection = dnsZone.Value.GetDnsARecords();
            var aRecord = await aRecordCollection.GetAsync(hostname);
            
            if (aRecord?.Value != null)
            {
                await aRecord.Value.DeleteAsync(Azure.WaitUntil.Completed);
                _logger.LogInformation(
                    "Successfully deleted DNS A record: {Hostname}.{Zone}",
                    hostname, _zoneName);
                return true;
            }
            
            _logger.LogWarning(
                "DNS A record not found for deletion: {Hostname}.{Zone}",
                hostname, _zoneName);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete DNS A record: {Hostname}", hostname);
            return false;
        }
    }
}
