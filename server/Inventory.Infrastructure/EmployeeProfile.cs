class EmployeeProfile
{
    public int Id { get; set; }
    public string UserId { get; set; } = null!;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int? StoreId { get; set; }
    public int? DistrictId { get; set; }
    public DateTime CreatedAt { get; set; }
}