using FactoryMonitoringWeb.Data;
using FactoryMonitoringWeb.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;
using System.Text.RegularExpressions;

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

        // ===================== PARSER (UPDATED & ROBUST) =====================
        private object ParseEnhancedLogFile(string content)
        {
            var barrelMap = new Dictionary<string, BarrelData>();
            var startMap = new Dictionary<string, Dictionary<string, int>>();

            var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            int processedLines = 0;

            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                if (line.StartsWith("SEM_LOG_VERSION") || line.StartsWith("DateTime")) continue;

                string scope = "", operationName = "", status = "", dataField = "";

                // Strategy 1: Tab Separated (Standard)
                var tabColumns = line.Split('\t');
                if (tabColumns.Length >= 11)
                {
                    scope = tabColumns[7].Trim();
                    operationName = tabColumns[8].Trim();
                    status = tabColumns[9].Trim();
                    dataField = tabColumns[10].Trim();
                }
                // Strategy 2: Robust Fallback (Space Separated or Mixed)
                else
                {
                    // Find the start of the JSON data to separate meta-data from payload
                    int jsonStartIndex = line.IndexOf('{');
                    if (jsonStartIndex == -1)
                    {
                        _logger.LogWarning("Skipping line: No JSON data found. Line: {Line}", line);
                        continue;
                    }

                    dataField = line.Substring(jsonStartIndex).Trim();
                    string metaPart = line.Substring(0, jsonStartIndex).Trim();

                    // Split the meta part by whitespace
                    var parts = Regex.Split(metaPart, @"\s+");

                    // We expect at least: [Status] [Scope] [OpName] [OpStatus]
                    // But typically columns: Date Time Machine LogType Lot Recipe Product Status Scope OpName OpStatus
                    if (parts.Length < 3)
                    {
                        _logger.LogWarning("Skipping line: Not enough columns. Line: {Line}", line);
                        continue;
                    }

                    // Extract the last 3 parts before JSON
                    status = parts[parts.Length - 1];       // e.g. START or END
                    operationName = parts[parts.Length - 2]; // e.g. Sequence_Mask_Pickup
                    scope = parts[parts.Length - 3];         // e.g. Sequence
                }

                // Parse JSON Data
                JObject json;
                try
                {
                    json = JObject.Parse(dataField);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("JSON Parse Error: {Message}. Data: {Data}", ex.Message, dataField);
                    continue;
                }

                var barrelId = json["barrelId"]?.ToString();
                if (string.IsNullOrEmpty(barrelId)) continue;

                // Use OperationName directly since it already contains the prefix
                var opKey = operationName;

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
                        processedLines++;
                    }
                }

                // ---------- END ----------
                else if (status == "END")
                {
                    if (!startMap[barrelId].ContainsKey(opKey))
                    {
                        // _logger.LogWarning("Orphaned END found for {Op} in Barrel {B}", opKey, barrelId);
                        continue;
                    }

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
                    processedLines++;
                }
            }

            _logger.LogInformation("Parsed {Count} valid operations across {BCount} barrels", processedLines, barrelMap.Count);

            // Calculate total execution time
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