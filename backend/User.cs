namespace backend;

public class User
{
    public int Id { get; set; }
    public required string UserEmail { get; set; }
    public required string Token { get; set; }
}
