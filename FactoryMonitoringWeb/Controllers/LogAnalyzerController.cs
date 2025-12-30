using FactoryMonitoringWeb.Data;
using FactoryMonitoringWeb.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;

namespace FactoryMonitoringWeb.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LogAnalyzerController : ControllerBase
    {
        private readonly FactoryDbContext _context;
        private readonly ILogger<LogAnalyzerController> _logger;

        public LogAnalyzerController(FactoryDbContext context, ILogger<LogAnalyzerController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ===================== LOG STRUCTURE =====================
        [HttpGet("structure/{pcId}")]
        public async Task<ActionResult<object>> GetLogStructure(int pcId)
        {
            try
            {
                var pc = await _context.FactoryPCs.FindAsync(pcId);
                if (pc == null)
                    return NotFound(new { error = "PC not found" });

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "GetLogStructure",
                    CommandData = JsonConvert.SerializeObject(new { LogPath = pc.LogFilePath }),
                    Status = "Pending",
                    CreatedDate = DateTime.UtcNow
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                var timeout = DateTime.UtcNow.AddSeconds(45);

                while (DateTime.UtcNow < timeout)
                {
                    await Task.Delay(1000);

                    var cmd = await _context.AgentCommands
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.CommandId == command.CommandId);

                    if (cmd?.Status == "Completed" && !string.IsNullOrEmpty(cmd.ResultData))
                    {
                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(cmd.ResultData);
                        return Ok(new
                        {
                            pcId,
                            rootPath = pc.LogFilePath,
                            files = result?["files"]
                        });
                    }

                    if (cmd?.Status == "Failed")
                        return StatusCode(500, new { error = cmd.ErrorMessage });
                }

                return StatusCode(408, new { error = "Request timeout - agent did not respond" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetLogStructure failed for PC {pcId}", pcId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ===================== FILE CONTENT =====================
        [HttpPost("file/{pcId}")]
        public async Task<ActionResult<object>> GetLogFileContent(int pcId, [FromBody] LogFileRequest request)
        {
            try
            {
                var pc = await _context.FactoryPCs.FindAsync(pcId);
                if (pc == null)
                    return NotFound(new { error = "PC not found" });

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "GetLogFileContent",
                    CommandData = JsonConvert.SerializeObject(new { FilePath = request.FilePath }),
                    Status = "Pending",
                    CreatedDate = DateTime.UtcNow
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                var timeout = DateTime.UtcNow.AddSeconds(60);

                while (DateTime.UtcNow < timeout)
                {
                    await Task.Delay(1000);

                    var cmd = await _context.AgentCommands
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.CommandId == command.CommandId);

                    if (cmd?.Status == "Completed" && !string.IsNullOrEmpty(cmd.ResultData))
                    {
                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(cmd.ResultData);
                        return Ok(new
                        {
                            fileName = Path.GetFileName(request.FilePath),
                            filePath = request.FilePath,
                            content = result?["content"],
                            size = result?["size"],
                            encoding = result?["encoding"] ?? "UTF-8"
                        });
                    }

                    if (cmd?.Status == "Failed")
                        return StatusCode(500, new { error = cmd.ErrorMessage });
                }

                return StatusCode(408, new { error = "Request timeout - agent did not respond" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetLogFileContent failed for PC {pcId}", pcId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ===================== ANALYZE =====================
        [HttpPost("analyze/{pcId}")]
        public async Task<ActionResult<object>> AnalyzeLogFile(int pcId, [FromBody] LogFileRequest request)
        {
            try
            {
                var pc = await _context.FactoryPCs.FindAsync(pcId);
                if (pc == null)
                    return NotFound(new { error = "PC not found" });

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "GetLogFileContent",
                    CommandData = JsonConvert.SerializeObject(new { FilePath = request.FilePath }),
                    Status = "Pending",
                    CreatedDate = DateTime.UtcNow
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                var timeout = DateTime.UtcNow.AddSeconds(60);
                string? fileContent = null;

                while (DateTime.UtcNow < timeout)
                {
                    await Task.Delay(1000);

                    var cmd = await _context.AgentCommands
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.CommandId == command.CommandId);

                    if (cmd?.Status == "Completed" && !string.IsNullOrEmpty(cmd.ResultData))
                    {
                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(cmd.ResultData);
                        fileContent = result?["content"]?.ToString();
                        break;
                    }

                    if (cmd?.Status == "Failed")
                        return StatusCode(500, new { error = "Failed to read file" });
                }

                if (fileContent == null)
                    return StatusCode(408, new { error = "Timeout reading file" });

                // REAL PARSING HAPPENS HERE
                return Ok(ParseEnhancedLogFile(fileContent));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AnalyzeLogFile failed for PC {pcId}", pcId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ===================== DOWNLOAD =====================
        [HttpPost("download/{pcId}")]
        public async Task<IActionResult> DownloadLogFile(int pcId, [FromBody] LogFileRequest request)
        {
            try
            {
                var pc = await _context.FactoryPCs.FindAsync(pcId);
                if (pc == null)
                    return NotFound();

                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "GetLogFileContent",
                    CommandData = JsonConvert.SerializeObject(new { FilePath = request.FilePath }),
                    Status = "Pending",
                    CreatedDate = DateTime.UtcNow
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                var timeout = DateTime.UtcNow.AddSeconds(60);

                while (DateTime.UtcNow < timeout)
                {
                    await Task.Delay(1000);

                    var cmd = await _context.AgentCommands
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.CommandId == command.CommandId);

                    if (cmd?.Status == "Completed" && !string.IsNullOrEmpty(cmd.ResultData))
                    {
                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(cmd.ResultData);
                        var bytes = Encoding.UTF8.GetBytes(result?["content"]?.ToString() ?? "");
                        return File(bytes, "text/plain", Path.GetFileName(request.FilePath));
                    }

                    if (cmd?.Status == "Failed")
                        return StatusCode(500);
                }

                return StatusCode(408);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DownloadLogFile failed for PC {pcId}", pcId);
                return StatusCode(500);
            }
        }

        // ===================== PARSER (WORKING) =====================
        private object ParseEnhancedLogFile(string content)
        {
            var barrelMap = new Dictionary<string, BarrelData>();
            var startMap = new Dictionary<string, Dictionary<string, int>>();

            var lines = content.Split('\n');

            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                if (line.StartsWith("SEM_LOG_VERSION") || line.StartsWith("DateTime")) continue;

                var columns = line.Split('\t');
                if (columns.Length < 11) continue;

                var scope = columns[7].Trim();
                var operationName = columns[8].Trim();
                var status = columns[9].Trim();
                var dataField = columns[10].Trim();

                JObject json;
                try { json = JObject.Parse(dataField); }
                catch { continue; }

                var barrelId = json["barrelId"]?.ToString();
                if (string.IsNullOrEmpty(barrelId)) continue;

                var opKey = $"{scope}_{operationName}";

                if (!barrelMap.ContainsKey(barrelId))
                {
                    barrelMap[barrelId] = new BarrelData { BarrelId = barrelId };
                    startMap[barrelId] = new Dictionary<string, int>();
                }

                // ---------- START ----------
                if (status == "START")
                {
                    var startTs = json["startTs"]?.Value<int>();
                    if (startTs != null)
                    {
                        startMap[barrelId][opKey] = startTs.Value;
                    }
                }

                // ---------- END ----------
                if (status == "END")
                {
                    if (!startMap[barrelId].ContainsKey(opKey)) continue;

                    var startTs = startMap[barrelId][opKey];
                    var endTs = json["endTs"]?.Value<int>();
                    if (endTs == null || endTs < startTs) continue;

                    var barrel = barrelMap[barrelId];

                    barrel.Operations.Add(new OperationData
                    {
                        OperationName = opKey,
                        StartTime = startTs,
                        EndTime = endTs.Value,
                        ActualDuration = endTs.Value - startTs,
                        IdealDuration = json["idealMs"]?.Value<int>() ?? 0,
                        Sequence = barrel.Operations.Count + 1
                    });

                    startMap[barrelId].Remove(opKey);
                }
            }

            // Calculate total execution time correctly
            foreach (var barrel in barrelMap.Values)
            {
                if (barrel.Operations.Count > 0)
                {
                    barrel.TotalExecutionTime =
                        barrel.Operations.Max(o => o.EndTime) -
                        barrel.Operations.Min(o => o.StartTime);
                }
            }

            return new
            {
                barrels = barrelMap.Values.Select(b => new
                {
                    barrelId = b.BarrelId,
                    totalExecutionTime = b.TotalExecutionTime,
                    operations = b.Operations
                }).ToList()
            };
        }
    }

    // ===================== SUPPORT TYPES =====================
    internal class BarrelData
    {
        public string BarrelId { get; set; } = "";
        public int TotalExecutionTime { get; set; }
        public List<OperationData> Operations { get; set; } = new();
    }

    internal class OperationData
    {
        public string OperationName { get; set; } = "";
        public int StartTime { get; set; }
        public int EndTime { get; set; }
        public int ActualDuration { get; set; }
        public int IdealDuration { get; set; }
        public int Sequence { get; set; }
    }

    public class LogFileRequest
    {
        public string FilePath { get; set; } = "";
    }
}
