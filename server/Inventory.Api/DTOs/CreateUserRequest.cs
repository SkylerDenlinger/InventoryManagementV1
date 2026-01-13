using System.ComponentModel.DataAnnotations;

public class CreateUserRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";

    [Required]
    public string Role { get; set; } = "";
}
