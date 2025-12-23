using System.ComponentModel.DataAnnotations;

namespace FactoryMonitoringWeb.Models
{
    public class ModelFile
    {
        [Key]
        public int ModelFileId { get; set; }

        [Required]
        [StringLength(255)]
        public string ModelName { get; set; } = string.Empty;

        [Required]
        public byte[] FileData { get; set; } = Array.Empty<byte>();

        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        public long FileSize { get; set; }

        public DateTime UploadedDate { get; set; } = DateTime.Now;

        [StringLength(100)]
        public string? UploadedBy { get; set; }

        public bool IsActive { get; set; } = true;

        // Model Library Enhancement
        public bool IsTemplate { get; set; } = false;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        // Navigation properties
        public virtual ICollection<ModelDistribution> ModelDistributions { get; set; } = new List<ModelDistribution>();
    }
}
