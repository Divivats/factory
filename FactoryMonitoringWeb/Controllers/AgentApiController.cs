using FactoryMonitoringWeb.Data;
using FactoryMonitoringWeb.Models;
using FactoryMonitoringWeb.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace FactoryMonitoringWeb.Controllers
{
    [Route("api/agent")]
    [ApiController]
    public class AgentApiController : ControllerBase
    {
        private readonly FactoryDbContext _context;
        private readonly ILogger<AgentApiController> _logger;

        public AgentApiController(FactoryDbContext context, ILogger<AgentApiController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AgentRegistrationResponse>> Register([FromBody] AgentRegistrationRequest request)
        {
            try
            {
                var existingPC = await _context.FactoryPCs
                    .FirstOrDefaultAsync(p => p.LineNumber == request.LineNumber 
                                            && p.PCNumber == request.PCNumber 
                                            && p.ModelVersion == request.ModelVersion);

                int pcId;

                if (existingPC == null)
                {
                    var newPC = new FactoryPC
                    {
                        LineNumber = request.LineNumber,
                        PCNumber = request.PCNumber,
                        IPAddress = request.IPAddress,
                        ConfigFilePath = request.ConfigFilePath,
                        LogFolderPath = request.LogFolderPath,
                        ModelFolderPath = request.ModelFolderPath,
                        ModelVersion = string.IsNullOrWhiteSpace(request.ModelVersion) ? "3.5" : request.ModelVersion,
                        IsOnline = true,
                        LastHeartbeat = DateTime.Now,
                        LogStructureJson = request.LogStructureJson
                    };

                    _context.FactoryPCs.Add(newPC);
                    await _context.SaveChangesAsync();
                    pcId = newPC.PCId;

                    _logger.LogInformation($"New PC registered: Line {request.LineNumber}, PC {request.PCNumber}, Version {request.ModelVersion}");
                }
                else
                {
                    existingPC.IPAddress = request.IPAddress;
                    existingPC.ConfigFilePath = request.ConfigFilePath;
                    existingPC.LogFolderPath = request.LogFolderPath;
                    existingPC.ModelFolderPath = request.ModelFolderPath;
                    existingPC.ModelVersion = string.IsNullOrWhiteSpace(request.ModelVersion)
                        ? existingPC.ModelVersion
                        : request.ModelVersion;
                    existingPC.IsOnline = true;
                    existingPC.LastHeartbeat = DateTime.Now;
                    existingPC.LastUpdated = DateTime.Now;

                    if (!string.IsNullOrEmpty(request.LogStructureJson))
                    {
                        existingPC.LogStructureJson = request.LogStructureJson;
                    }

                    await _context.SaveChangesAsync();
                    pcId = existingPC.PCId;

                    _logger.LogInformation($"PC re-registered: Line {request.LineNumber}, PC {request.PCNumber}, Version {request.ModelVersion}");
                }

                return Ok(new AgentRegistrationResponse
                {
                    Success = true,
                    PCId = pcId,
                    Message = "Registration successful"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during agent registration");
                return StatusCode(500, new AgentRegistrationResponse
                {
                    Success = false,
                    Message = $"Registration failed: {ex.Message}"
                });
            }
        }

        [HttpPost("heartbeat")]
        public async Task<ActionResult<HeartbeatResponse>> Heartbeat([FromBody] HeartbeatRequest request)
        {
            try
            {
                var pc = await _context.FactoryPCs.FindAsync(request.PCId);
                if (pc == null)
                {
                    return NotFound(new HeartbeatResponse { Success = false });
                }

                pc.LastHeartbeat = DateTime.Now;
                pc.IsOnline = true;
                pc.IsApplicationRunning = request.IsApplicationRunning;
                pc.LastUpdated = DateTime.Now;

                var pendingCommands = await _context.AgentCommands
                    .Where(c => c.PCId == request.PCId && c.Status == "Pending")
                    .OrderBy(c => c.CreatedDate)
                    .ToListAsync();

                var commands = pendingCommands.Select(c => new CommandInfo
                {
                    CommandId = c.CommandId,
                    CommandType = c.CommandType,
                    CommandData = c.CommandData
                }).ToList();

                foreach (var cmd in pendingCommands)
                {
                    cmd.Status = "InProgress";
                    cmd.ExecutedDate = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Ok(new HeartbeatResponse
                {
                    Success = true,
                    HasPendingCommands = commands.Count > 0,
                    Commands = commands
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during heartbeat");
                return StatusCode(500, new HeartbeatResponse { Success = false });
            }
        }

        [HttpPost("updateconfig")]
        public async Task<ActionResult<ApiResponse>> UpdateConfig([FromBody] ConfigUpdateRequest request)
        {
            try
            {
                var existingConfig = await _context.ConfigFiles
                    .FirstOrDefaultAsync(c => c.PCId == request.PCId);

                if (existingConfig == null)
                {
                    var newConfig = new ConfigFile
                    {
                        PCId = request.PCId,
                        ConfigContent = request.ConfigContent,
                        LastModified = DateTime.Now
                    };
                    _context.ConfigFiles.Add(newConfig);
                }
                else
                {
                    existingConfig.ConfigContent = request.ConfigContent;
                    existingConfig.LastModified = DateTime.Now;

                    if (existingConfig.PendingUpdate)
                    {
                        existingConfig.UpdateApplied = true;
                        existingConfig.PendingUpdate = false;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Config updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating config");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = $"Config update failed: {ex.Message}"
                });
            }
        }

        [HttpPost("updatelog")]
        public async Task<ActionResult<ApiResponse>> UpdateLog([FromBody] LogUpdateRequest request)
        {
            try
            {
                var existingLog = await _context.LogFiles
                    .FirstOrDefaultAsync(l => l.PCId == request.PCId && l.LogFileName == request.LogFileName);

                if (existingLog == null)
                {
                    var newLog = new LogFile
                    {
                        PCId = request.PCId,
                        LogContent = request.LogContent,
                        LogFileName = request.LogFileName,
                        LastModified = DateTime.Now
                    };
                    _context.LogFiles.Add(newLog);
                }
                else
                {
                    existingLog.LogContent = request.LogContent;
                    existingLog.LastModified = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Log updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating log");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = $"Log update failed: {ex.Message}"
                });
            }
        }

        [HttpPost("synclogs")]
        public async Task<ActionResult<ApiResponse>> SyncLogStructure([FromBody] LogStructureSyncRequest request)
        {
            try
            {
                var pc = await _context.FactoryPCs.FindAsync(request.PCId);
                if (pc == null) return NotFound(new ApiResponse { Success = false, Message = "PC not found" });

                pc.LogStructureJson = request.LogStructureJson;
                pc.LastUpdated = DateTime.Now;

                await _context.SaveChangesAsync();
                return Ok(new ApiResponse { Success = true, Message = "Log structure synced" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing log structure");
                return StatusCode(500, new ApiResponse { Success = false, Message = ex.Message });
            }
        }

        [HttpPost("syncmodels")]
        public async Task<ActionResult<ApiResponse>> SyncModels([FromBody] ModelSyncRequest request)
        {
            try
            {
                var existingModels = await _context.Models
                    .Where(m => m.PCId == request.PCId)
                    .ToListAsync();

                foreach (var model in existingModels)
                {
                    model.IsCurrentModel = false;
                }

                foreach (var modelInfo in request.Models)
                {
                    var existingModel = existingModels
                        .FirstOrDefault(m => m.ModelName == modelInfo.ModelName);

                    if (existingModel == null)
                    {
                        var newModel = new Model
                        {
                            PCId = request.PCId,
                            ModelName = modelInfo.ModelName,
                            ModelPath = modelInfo.ModelPath,
                            IsCurrentModel = modelInfo.IsCurrent,
                            LastUsed = modelInfo.IsCurrent ? DateTime.Now : null
                        };
                        _context.Models.Add(newModel);
                    }
                    else
                    {
                        existingModel.ModelPath = modelInfo.ModelPath;
                        existingModel.IsCurrentModel = modelInfo.IsCurrent;
                        if (modelInfo.IsCurrent)
                        {
                            existingModel.LastUsed = DateTime.Now;
                        }
                    }
                }

                var modelNamesFromRequest = request.Models.Select(m => m.ModelName).ToList();
                var modelsToRemove = existingModels
                    .Where(m => !modelNamesFromRequest.Contains(m.ModelName))
                    .ToList();

                _context.Models.RemoveRange(modelsToRemove);

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Models synced successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing models");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = $"Model sync failed: {ex.Message}"
                });
            }
        }

        [HttpPost("commandresult")]
        public async Task<ActionResult<ApiResponse>> CommandResult([FromBody] CommandResultRequest request)
        {
            try
            {
                var command = await _context.AgentCommands.FindAsync(request.CommandId);
                if (command == null)
                {
                    return NotFound(new ApiResponse
                    {
                        Success = false,
                        Message = "Command not found"
                    });
                }

                command.Status = request.Status;
                command.ResultData = request.ResultData;
                command.ErrorMessage = request.ErrorMessage;
                command.ExecutedDate = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Command result recorded"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording command result");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = $"Command result failed: {ex.Message}"
                });
            }
        }

        [HttpGet("getconfigupdate/{pcId}")]
        public async Task<ActionResult<ApiResponse>> GetConfigUpdate(int pcId)
        {
            try
            {
                var config = await _context.ConfigFiles
                    .FirstOrDefaultAsync(c => c.PCId == pcId && c.PendingUpdate);

                if (config == null)
                {
                    return Ok(new ApiResponse
                    {
                        Success = true,
                        Message = "No pending update",
                        Data = null
                    });
                }

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Config update available",
                    Data = new
                    {
                        config.UpdatedContent,
                        config.UpdateRequestTime
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting config update");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = $"Get config update failed: {ex.Message}"
                });
            }
        }

        // NEW: Endpoint for agent to upload model files back to server
        [HttpPost("uploadmodelfile")]
        public async Task<ActionResult<ApiResponse>> UploadModelFile([FromForm] IFormFile file, [FromForm] string modelName)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "No file uploaded"
                    });
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
                    IsActive = true
                };

                _context.ModelFiles.Add(modelFile);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Model file uploaded successfully",
                    Data = new { ModelFileId = modelFile.ModelFileId }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading model file from agent");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = $"Model upload failed: {ex.Message}"
                });
            }
        }

        [HttpPost("uploadmodel")]
        public async Task<ActionResult<ApiResponse>> UploadModel([FromForm] IFormFile file, [FromForm] string modelName, [FromForm] int pcId)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new ApiResponse
                    {
                        Success = false,
                        Message = "No file uploaded"
                    });
                }

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);

                var modelFile = new ModelFile
                {
                    ModelName = modelName,
                    FileName = file.FileName,
                    FileData = memoryStream.ToArray(),
                    FileSize = file.Length,
                    UploadedDate = DateTime.Now
                };

                _context.ModelFiles.Add(modelFile);
                await _context.SaveChangesAsync();

                // Create download URL for the agent
                var downloadUrl = $"/api/agent/downloadmodel/{modelFile.ModelFileId}";

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "UploadModel",
                    CommandData = JsonConvert.SerializeObject(new
                    {
                        ModelFileId = modelFile.ModelFileId,
                        ModelName = modelName,
                        FileName = file.FileName,
                        DownloadUrl = downloadUrl  // ADDED: Agent needs this
                    }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Model uploaded successfully",
                    Data = new { ModelFileId = modelFile.ModelFileId }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading model");
                return StatusCode(500, new ApiResponse
                {
                    Success = false,
                    Message = $"Model upload failed: {ex.Message}"
                });
            }
        }

        [HttpGet("downloadmodel/{modelFileId}")]
        public async Task<IActionResult> DownloadModel(int modelFileId)
        {
            try
            {
                var modelFile = await _context.ModelFiles.FindAsync(modelFileId);
                if (modelFile == null)
                {
                    return NotFound();
                }

                return File(modelFile.FileData, "application/octet-stream", modelFile.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading model");
                return StatusCode(500);
            }
        }
    }
}