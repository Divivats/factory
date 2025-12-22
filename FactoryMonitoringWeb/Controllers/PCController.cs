using FactoryMonitoringWeb.Data;
using FactoryMonitoringWeb.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Text;

namespace FactoryMonitoringWeb.Controllers
{
    public class PCController : Controller
    {
        private readonly FactoryDbContext _context;
        private readonly ILogger<PCController> _logger;

        public PCController(FactoryDbContext context, ILogger<PCController> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IActionResult> Details(int id)
        {
            var pc = await _context.FactoryPCs
                .Include(p => p.ConfigFile)
                .Include(p => p.Models)
                .FirstOrDefaultAsync(p => p.PCId == id);

            if (pc == null)
            {
                return NotFound();
            }

            return View(pc);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateConfig(int pcId, string configContent)
        {
            try
            {
                var config = await _context.ConfigFiles.FirstOrDefaultAsync(c => c.PCId == pcId);

                if (config == null)
                {
                    return Json(new { success = false, message = "Config file not found" });
                }

                config.UpdatedContent = configContent;
                config.PendingUpdate = true;
                config.UpdateRequestTime = DateTime.Now;
                config.UpdateApplied = false;

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "UpdateConfig",
                    CommandData = configContent,
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Config update queued successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating config");
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DownloadConfig(int pcId)
        {
            try
            {
                var config = await _context.ConfigFiles.FirstOrDefaultAsync(c => c.PCId == pcId);

                if (config == null || string.IsNullOrEmpty(config.ConfigContent))
                {
                    return NotFound("Config file not found");
                }

                var pc = await _context.FactoryPCs.FindAsync(pcId);
                var fileName = $"config_Line{pc?.LineNumber ?? 0}_PC{pc?.PCNumber ?? 0}.ini";

                var bytes = Encoding.UTF8.GetBytes(config.ConfigContent);
                return File(bytes, "text/plain", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading config");
                return StatusCode(500, "Error downloading config file");
            }
        }

        [HttpPost]
        public async Task<IActionResult> ChangeModel(int pcId, string modelName)
        {
            try
            {
                var model = await _context.Models
                    .FirstOrDefaultAsync(m => m.PCId == pcId && m.ModelName == modelName);

                if (model == null)
                {
                    return Json(new { success = false, message = "Model not found" });
                }

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "ChangeModel",
                    CommandData = JsonConvert.SerializeObject(new
                    {
                        ModelName = modelName,
                        ModelPath = model.ModelPath
                    }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Model change command queued" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing model");
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteModel(int pcId, string modelName)
        {
            try
            {
                var model = await _context.Models
                    .FirstOrDefaultAsync(m => m.PCId == pcId && m.ModelName == modelName);

                if (model == null)
                {
                    return Json(new { success = false, message = "Model not found" });
                }

                if (model.IsCurrentModel)
                {
                    return Json(new { success = false, message = "Cannot delete currently active model" });
                }

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "DeleteModel",
                    CommandData = JsonConvert.SerializeObject(new
                    {
                        ModelName = modelName,
                        ModelPath = model.ModelPath
                    }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Model deletion queued" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting model");
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DownloadModel(int pcId, string modelName)
        {
            try
            {
                var model = await _context.Models
                    .FirstOrDefaultAsync(m => m.PCId == pcId && m.ModelName == modelName);

                if (model == null)
                {
                    return Json(new { success = false, message = "Model not found" });
                }

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "DownloadModel",
                    CommandData = JsonConvert.SerializeObject(new
                    {
                        ModelName = modelName,
                        ModelPath = model.ModelPath
                    }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Model download initiated", commandId = command.CommandId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating model download");
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // NEW ENDPOINTS FOR UI AUTO-REFRESH
        [HttpGet]
        public async Task<IActionResult> GetModels(int pcId)
        {
            try
            {
                var models = await _context.Models
                    .Where(m => m.PCId == pcId)
                    .Select(m => new
                    {
                        modelName = m.ModelName,
                        modelPath = m.ModelPath,
                        isCurrent = m.IsCurrentModel,
                        lastUsed = m.LastUsed
                    })
                    .ToListAsync();

                return Json(new
                {
                    success = true,
                    models = models
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting models");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetLatestConfig(int pcId)
        {
            try
            {
                var config = await _context.ConfigFiles
                    .FirstOrDefaultAsync(c => c.PCId == pcId);

                if (config == null)
                {
                    return Json(new { updated = false });
                }

                return Json(new
                {
                    updated = true,
                    configContent = config.ConfigContent,
                    lastModified = config.LastModified
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting latest config");
                return Json(new { updated = false, error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetPCStatus(int pcId)
        {
            try
            {
                var pc = await _context.FactoryPCs.FindAsync(pcId);

                if (pc == null)
                {
                    return Json(new { success = false });
                }

                return Json(new
                {
                    success = true,
                    isOnline = pc.IsOnline,
                    isApplicationRunning = pc.IsApplicationRunning,
                    lastHeartbeat = pc.LastHeartbeat?.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting PC status");
                return Json(new { success = false, error = ex.Message });
            }
        }
    }
}