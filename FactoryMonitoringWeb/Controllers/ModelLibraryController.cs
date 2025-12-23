using FactoryMonitoringWeb.Data;
using FactoryMonitoringWeb.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace FactoryMonitoringWeb.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ModelLibraryController : ControllerBase
    {
        private readonly FactoryDbContext _context;
        private readonly ILogger<ModelLibraryController> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ModelLibraryController(FactoryDbContext context, ILogger<ModelLibraryController> logger, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetBaseUrl()
        {
            var request = _httpContextAccessor.HttpContext.Request;
            return $"{request.Scheme}://{request.Host}";
        }

        // GET: api/ModelLibrary
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetLibraryModels()
        {
            try
            {
                var models = await _context.ModelFiles
                    .Where(m => m.IsTemplate && m.IsActive)
                    .OrderByDescending(m => m.UploadedDate)
                    .Select(m => new
                    {
                        m.ModelFileId,
                        m.ModelName,
                        m.FileName,
                        m.FileSize,
                        m.Description,
                        m.Category,
                        m.UploadedDate,
                        m.UploadedBy
                    })
                    .ToListAsync();

                return Ok(models);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving model library");
                return StatusCode(500, new { error = "Failed to retrieve models" });
            }
        }

        // GET: api/ModelLibrary/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetModel(int id)
        {
            try
            {
                var model = await _context.ModelFiles
                    .Where(m => m.ModelFileId == id && m.IsTemplate)
                    .Select(m => new
                    {
                        m.ModelFileId,
                        m.ModelName,
                        m.FileName,
                        m.FileSize,
                        m.Description,
                        m.Category,
                        m.UploadedDate,
                        m.UploadedBy
                    })
                    .FirstOrDefaultAsync();

                if (model == null)
                {
                    return NotFound(new { error = "Model not found" });
                }

                return Ok(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving model {id}");
                return StatusCode(500, new { error = "Failed to retrieve model" });
            }
        }

        // POST: api/ModelLibrary/upload
        [HttpPost("upload")]
        public async Task<ActionResult<object>> UploadModel([FromForm] IFormFile file, [FromForm] string modelName, [FromForm] string? description, [FromForm] string? category)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "No file uploaded" });
                }

                if (string.IsNullOrWhiteSpace(modelName))
                {
                    modelName = Path.GetFileNameWithoutExtension(file.FileName);
                }

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);

                var modelFile = new ModelFile
                {
                    ModelName = modelName,
                    FileName = file.FileName,
                    FileData = memoryStream.ToArray(),
                    FileSize = file.Length,
                    UploadedDate = DateTime.Now,
                    IsActive = true,
                    IsTemplate = true,  // This is a library template
                    Description = description,
                    Category = category
                };

                _context.ModelFiles.Add(modelFile);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Model uploaded to library successfully",
                    modelFileId = modelFile.ModelFileId,
                    modelName = modelFile.ModelName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading model to library");
                return StatusCode(500, new { error = $"Upload failed: {ex.Message}" });
            }
        }

        // POST: api/ModelLibrary/apply
        [HttpPost("apply")]
        public async Task<ActionResult<object>> ApplyModelToTargets([FromBody] ApplyModelRequest request)
        {
            try
            {
                if (request.ModelFileId <= 0)
                {
                    return BadRequest(new { error = "Invalid model file ID" });
                }

                var modelFile = await _context.ModelFiles.FindAsync(request.ModelFileId);
                if (modelFile == null || !modelFile.IsTemplate)
                {
                    return NotFound(new { error = "Model not found in library" });
                }

                // Build query for target PCs
                var query = _context.FactoryPCs.AsQueryable();

                if (request.TargetType == "version" && !string.IsNullOrWhiteSpace(request.Version))
                {
                    query = query.Where(p => p.ModelVersion == request.Version);
                }
                else if (request.TargetType == "line" && request.LineNumber.HasValue)
                {
                    query = query.Where(p => p.LineNumber == request.LineNumber.Value);
                }
                else if (request.TargetType == "lineandversion" && request.LineNumber.HasValue && !string.IsNullOrWhiteSpace(request.Version))
                {
                    query = query.Where(p => p.LineNumber == request.LineNumber.Value && p.ModelVersion == request.Version);
                }
                else if (request.TargetType == "selected" && request.SelectedPCIds != null && request.SelectedPCIds.Any())
                {
                    query = query.Where(p => request.SelectedPCIds.Contains(p.PCId));
                }
                // If "all", no filter needed

                var targetPCs = await query.ToListAsync();

                if (targetPCs.Count == 0)
                {
                    return BadRequest(new { error = "No PCs match the specified criteria" });
                }

                // Create download URL
                var baseUrl = GetBaseUrl();
                var downloadUrl = $"{baseUrl}/api/agent/downloadmodel/{modelFile.ModelFileId}";

                // Create commands for each target PC
                foreach (var pc in targetPCs)
                {
                    var command = new AgentCommand
                    {
                        PCId = pc.PCId,
                        CommandType = "UploadModel",
                        CommandData = JsonConvert.SerializeObject(new
                        {
                            ModelFileId = modelFile.ModelFileId,
                            ModelName = modelFile.ModelName,
                            FileName = modelFile.FileName,
                            DownloadUrl = downloadUrl,
                            ApplyOnUpload = request.ApplyImmediately
                        }),
                        Status = "Pending",
                        CreatedDate = DateTime.Now
                    };

                    _context.AgentCommands.Add(command);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Model deployment initiated for {targetPCs.Count} PC(s)",
                    affectedPCs = targetPCs.Count,
                    targets = targetPCs.Select(p => new
                    {
                        pcId = p.PCId,
                        name = $"Line {p.LineNumber} - PC {p.PCNumber}",
                        version = p.ModelVersion
                    })
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying model to targets");
                return StatusCode(500, new { error = $"Apply failed: {ex.Message}" });
            }
        }

        // DELETE: api/ModelLibrary/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteModel(int id)
        {
            try
            {
                var model = await _context.ModelFiles.FindAsync(id);
                if (model == null || !model.IsTemplate)
                {
                    return NotFound(new { error = "Model not found in library" });
                }

                // Soft delete - mark as inactive
                model.IsActive = false;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Model removed from library" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting model {id}");
                return StatusCode(500, new { error = "Delete failed" });
            }
        }

        // GET: api/ModelLibrary/download/{id}
        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadModel(int id)
        {
            try
            {
                var model = await _context.ModelFiles.FindAsync(id);
                if (model == null || !model.IsTemplate)
                {
                    return NotFound();
                }

                return File(model.FileData, "application/zip", model.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error downloading model {id}");
                return StatusCode(500);
            }
        }
    }

    // Request DTOs
    public class ApplyModelRequest
    {
        public int ModelFileId { get; set; }
        public string TargetType { get; set; } = "all"; // "all", "version", "line", "lineandversion", "selected"
        public string? Version { get; set; }
        public int? LineNumber { get; set; }
        public List<int>? SelectedPCIds { get; set; }
        public bool ApplyImmediately { get; set; } = true;
    }
}

