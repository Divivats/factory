using System.Collections.Generic;

namespace FactoryMonitoringWeb.Models
{
    public class DashboardViewModel
    {
        public List<string> Versions { get; set; } = new List<string>();
        public string? SelectedVersion { get; set; }
        public string ViewMode { get; set; } = "cards"; // "cards" or "list"
        public List<FactoryPC> PCs { get; set; } = new List<FactoryPC>();
        public List<int> LineNumbers { get; set; } = new List<int>();
    }
}


