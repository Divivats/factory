using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FactoryMonitoringWeb.Models
{
    public class LogFile
    {
        [Key]
        public int LogId { get; set; }

        [Required]
        public int PCId { get; set; }

        [Required]
        public string LogContent { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string LogFileName { get; set; } = string.Empty;

        public DateTime LastModified { get; set; } = DateTime.Now;

        // Navigation property
        [ForeignKey("PCId")]
        public virtual FactoryPC? FactoryPC { get; set; }
    }
}
