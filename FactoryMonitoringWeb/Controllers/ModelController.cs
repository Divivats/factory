using FactoryMonitoringWeb.Data;
using FactoryMonitoringWeb.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace FactoryMonitoringWeb.Controllers
{
    public class ModelController : Controller
    {
        private readonly FactoryDbContext _context;
        private readonly ILogger<ModelController> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ModelController(FactoryDbContext context, ILogger<ModelController> logger, IHttpContextAccessor httpContextAccessor)
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

        [HttpPost]
        public async Task<IActionResult> UploadModel(IFormFile modelFile, int pcId)
        {
            try
            {
                if (modelFile == null || modelFile.Length == 0)
                {
                    return Json(new { success = false, message = "No file uploaded" });
                }

                using var memoryStream = new MemoryStream();
                await modelFile.CopyToAsync(memoryStream);

                var modelName = Path.GetFileNameWithoutExtension(modelFile.FileName);

                var newModelFile = new ModelFile
                {
                    ModelName = modelName,
                    FileName = modelFile.FileName,
                    FileData = memoryStream.ToArray(),
                    FileSize = modelFile.Length,
                    UploadedDate = DateTime.Now,
                    IsActive = true
                };

                _context.ModelFiles.Add(newModelFile);
                await _context.SaveChangesAsync();

                // Create full download URL
                var baseUrl = GetBaseUrl();
                var downloadUrl = $"{baseUrl}/api/agent/downloadmodel/{newModelFile.ModelFileId}";

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "UploadModel",
                    CommandData = JsonConvert.SerializeObject(new
                    {
                        ModelFileId = newModelFile.ModelFileId,
                        ModelName = modelName,
                        FileName = modelFile.FileName,
                        DownloadUrl = downloadUrl  // ADDED: Full URL for agent
                    }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Model upload initiated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading model");
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> BulkUploadModel(IFormFile modelFile, string targetType, int? lineNumber, string? version, bool applyOnUpload = true)
        {
            try
            {
                if (modelFile == null || modelFile.Length == 0)
                {
                    return Json(new { success = false, message = "No file uploaded" });
                }

                using var memoryStream = new MemoryStream();
                await modelFile.CopyToAsync(memoryStream);

                var modelName = Path.GetFileNameWithoutExtension(modelFile.FileName);

                var newModelFile = new ModelFile
                {
                    ModelName = modelName,
                    FileName = modelFile.FileName,
                    FileData = memoryStream.ToArray(),
                    FileSize = modelFile.Length,
                    UploadedDate = DateTime.Now,
                    IsActive = true
                };

                _context.ModelFiles.Add(newModelFile);
                await _context.SaveChangesAsync();

                List<FactoryPC> targetPCs;
                var query = _context.FactoryPCs.AsQueryable();

                // Build query based on target type
                if (targetType == "all")
                {
                    targetPCs = await query.ToListAsync();
                }
                else if (targetType == "line" && lineNumber.HasValue)
                {
                    targetPCs = await query
                        .Where(p => p.LineNumber == lineNumber.Value)
                        .ToListAsync();
                }
                else if (targetType == "version" && !string.IsNullOrWhiteSpace(version))
                {
                    targetPCs = await query
                        .Where(p => p.ModelVersion == version)
                        .ToListAsync();
                }
                else if (targetType == "lineandversion" && lineNumber.HasValue && !string.IsNullOrWhiteSpace(version))
                {
                    targetPCs = await query
                        .Where(p => p.LineNumber == lineNumber.Value && p.ModelVersion == version)
                        .ToListAsync();
                }
                else
                {
                    return Json(new { success = false, message = "Invalid target type or missing parameters" });
                }

                if (targetPCs.Count == 0)
                {
                    return Json(new { success = false, message = "No PCs found matching the criteria" });
                }

                // Create full download URL
                var baseUrl = GetBaseUrl();
                var downloadUrl = $"{baseUrl}/api/agent/downloadmodel/{newModelFile.ModelFileId}";

                foreach (var pc in targetPCs)
                {
                    var command = new AgentCommand
                    {
                        PCId = pc.PCId,
                        CommandType = "UploadModel",
                        CommandData = JsonConvert.SerializeObject(new
                        {
                            ModelFileId = newModelFile.ModelFileId,
                            ModelName = modelName,
                            FileName = modelFile.FileName,
                            DownloadUrl = downloadUrl,
                            ApplyOnUpload = applyOnUpload
                        }),
                        Status = "Pending",
                        CreatedDate = DateTime.Now
                    };

                    _context.AgentCommands.Add(command);
                }

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = $"Model upload initiated for {targetPCs.Count} PC(s)",
                    affectedPCs = targetPCs.Count,
                    targetType = targetType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk model upload");
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DownloadModelFile(int modelFileId)
        {
            try
            {
                var modelFile = await _context.ModelFiles.FindAsync(modelFileId);
                if (modelFile == null)
                {
                    return NotFound();
                }

                return File(modelFile.FileData, "application/zip", modelFile.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading model file");
                return StatusCode(500);
            }
        }

        [HttpGet]
        public async Task<IActionResult> CheckDownloadStatus(int commandId)
        {
            try
            {
                var command = await _context.AgentCommands.FindAsync(commandId);
                if (command == null)
                {
                    return Json(new { success = false, message = "Command not found" });
                }

                if (command.Status == "Completed" && !string.IsNullOrEmpty(command.ResultData))
                {
                    var resultData = JsonConvert.DeserializeObject<Dictionary<string, object>>(command.ResultData);
                    if (resultData != null && resultData.ContainsKey("ModelFileId"))
                    {
                        var modelFileId = Convert.ToInt32(resultData["ModelFileId"]);
                        return Json(new
                        {
                            success = true,
                            status = "Completed",
                            modelFileId = modelFileId,
                            downloadUrl = Url.Action("DownloadModelFile", "Model", new { modelFileId })
                        });
                    }
                }

                return Json(new
                {
                    success = true,
                    status = command.Status,
                    message = command.ErrorMessage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking download status");
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }
    }
}