using FactoryMonitoringWeb.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FactoryMonitoringWeb.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly FactoryDbContext _context;
        private readonly ILogger<ApiController> _logger;

        public ApiController(FactoryDbContext context, ILogger<ApiController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/api/versions
        [HttpGet("versions")]
        public async Task<ActionResult<IEnumerable<string>>> GetVersions()
        {
            try
            {
                var versions = await _context.FactoryPCs
                    .Select(p => p.ModelVersion)
                    .Distinct()
                    .OrderBy(v => v)
                    .ToListAsync();

                return Ok(versions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving versions");
                return StatusCode(500, new { error = "Failed to retrieve versions" });
            }
        }

        // GET: api/api/lines
        [HttpGet("lines")]
        public async Task<ActionResult<IEnumerable<int>>> GetLines()
        {
            try
            {
                var lines = await _context.FactoryPCs
                    .Select(p => p.LineNumber)
                    .Distinct()
                    .OrderBy(l => l)
                    .ToListAsync();

                return Ok(lines);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving lines");
                return StatusCode(500, new { error = "Failed to retrieve lines" });
            }
        }

        // GET: api/api/pcs
        [HttpGet("pcs")]
        public async Task<ActionResult<object>> GetPCs([FromQuery] string? version = null, [FromQuery] int? line = null)
        {
            try
            {
                var query = _context.FactoryPCs
                    .Include(p => p.Models)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(version))
                {
                    query = query.Where(p => p.ModelVersion == version);
                }

                if (line.HasValue)
                {
                    query = query.Where(p => p.LineNumber == line.Value);
                }

                var pcs = await query
                    .OrderBy(p => p.LineNumber)
                    .ThenBy(p => p.PCNumber)
                    .Select(p => new
                    {
                        p.PCId,
                        p.LineNumber,
                        p.PCNumber,
                        p.IPAddress,
                        p.ModelVersion,
                        p.IsOnline,
                        p.IsApplicationRunning,
                        p.LastHeartbeat,
                        p.LastUpdated,
                        CurrentModel = p.Models
                            .Where(m => m.IsCurrentModel)
                            .Select(m => new { m.ModelName, m.ModelPath })
                            .FirstOrDefault(),
                        ModelCount = p.Models.Count
                    })
                    .ToListAsync();

                // Get target models for lines in this version
                var targetModels = await _context.LineTargetModels
                    .Where(ltm => ltm.ModelVersion == version)
                    .ToDictionaryAsync(ltm => ltm.LineNumber, ltm => ltm.TargetModelName);

                // Group by line and include target model
                var grouped = pcs.GroupBy(p => p.LineNumber)
                    .Select(g => new
                    {
                        LineNumber = g.Key,
                        TargetModelName = targetModels.ContainsKey(g.Key) ? targetModels[g.Key] : null,
                        Pcs = g.ToList()  // Changed from PCs to Pcs (will become "pcs" in camelCase JSON)
                    })
                    .OrderBy(g => g.LineNumber)
                    .ToList();

                return Ok(new
                {
                    total = pcs.Count,
                    online = pcs.Count(p => p.IsOnline),
                    offline = pcs.Count(p => !p.IsOnline),
                    lines = grouped
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving PCs");
                return StatusCode(500, new { error = "Failed to retrieve PCs" });
            }
        }

        // GET: api/api/pc/{id}
        [HttpGet("pc/{id}")]
        public async Task<ActionResult<object>> GetPC(int id)
        {
            try
            {
                var pc = await _context.FactoryPCs
                    .Include(p => p.Models)
                    .Include(p => p.ConfigFile)
                    .FirstOrDefaultAsync(p => p.PCId == id);

                if (pc == null)
                {
                    return NotFound(new { error = "PC not found" });
                }

                return Ok(new
                {
                    pc.PCId,
                    pc.LineNumber,
                    pc.PCNumber,
                    pc.IPAddress,
                    pc.ModelVersion,
                    pc.ConfigFilePath,
                    pc.LogFolderPath,
                    pc.ModelFolderPath,
                    pc.IsOnline,
                    pc.IsApplicationRunning,
                    pc.LastHeartbeat,
                    pc.RegisteredDate,
                    pc.LastUpdated,
                    CurrentModel = pc.Models
                        .Where(m => m.IsCurrentModel)
                        .Select(m => new { m.ModelId, m.ModelName, m.ModelPath, m.LastUsed })
                        .FirstOrDefault(),
                    AvailableModels = pc.Models
                        .OrderBy(m => m.ModelName)
                        .Select(m => new
                        {
                            m.ModelId,
                            m.ModelName,
                            m.ModelPath,
                            m.IsCurrentModel,
                            m.DiscoveredDate,
                            m.LastUsed
                        })
                        .ToList(),
                    Config = pc.ConfigFile != null ? new
                    {
                        pc.ConfigFile.ConfigContent,
                        pc.ConfigFile.LastModified
                    } : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving PC {id}");
                return StatusCode(500, new { error = "Failed to retrieve PC details" });
            }
        }

        // GET: api/api/stats
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetStats()
        {
            try
            {
                var totalPCs = await _context.FactoryPCs.CountAsync();
                var onlinePCs = await _context.FactoryPCs.CountAsync(p => p.IsOnline);
                var runningApps = await _context.FactoryPCs.CountAsync(p => p.IsApplicationRunning);
                var versions = await _context.FactoryPCs
                    .GroupBy(p => p.ModelVersion)
                    .Select(g => new { Version = g.Key, Count = g.Count() })
                    .ToListAsync();
                var lines = await _context.FactoryPCs
                    .GroupBy(p => p.LineNumber)
                    .Select(g => new { Line = g.Key, Count = g.Count() })
                    .OrderBy(g => g.Line)
                    .ToListAsync();

                return Ok(new
                {
                    totalPCs,
                    onlinePCs,
                    offlinePCs = totalPCs - onlinePCs,
                    runningApps,
                    versions,
                    lines
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving stats");
                return StatusCode(500, new { error = "Failed to retrieve statistics" });
            }
        }
    }
}

