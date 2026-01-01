namespace backend;

public class Record
{
    public int Id { get; set; }
    public required string Token { get; set; }
    public required string IpAddress { get; set; }
    public required string Hostname { get; set; }
    public string? OldHostname { get; set; } // Tracks previous hostname when updated
    public required string Status { get; set; } // "active" or "added"
    public DateTime LastUpdatedAt { get; set; }
}
