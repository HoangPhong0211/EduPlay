namespace BE.DTOs
{
    public class StudentDashboardDto
    {
        public string Nickname { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public List<string> EarnedBadges { get; set; } = new List<string>();
    }
}