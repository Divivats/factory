// Log Analyzer API Controller - FIXED VERSION
// Location: Controllers/LogAnalyzerController.cs
// FIX: Added AsNoTracking() to prevent Entity Framework caching issues

using FactoryMonitoringWeb.Data;
using FactoryMonitoringWeb.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
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

        // GET: api/LogAnalyzer/structure/{pcId}
        [HttpGet("structure/{pcId}")]
        public async Task<ActionResult<object>> GetLogStructure(int pcId)
        {
            try
            {
                _logger.LogInformation($"GetLogStructure requested for PC {pcId}");

                var pc = await _context.FactoryPCs.FindAsync(pcId);
                if (pc == null)
                {
                    _logger.LogWarning($"PC {pcId} not found");
                    return NotFound(new { error = "PC not found" });
                }

                // Send command to agent to get log folder structure
                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "GetLogStructure",
                    CommandData = JsonConvert.SerializeObject(new
                    {
                        LogPath = pc.LogFilePath
                    }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Command created: CommandId={command.CommandId}");

                // Poll for result (increased timeout to 30 seconds)
                var timeout = DateTime.Now.AddSeconds(30);
                int pollCount = 0;

                while (DateTime.Now < timeout)
                {
                    await Task.Delay(500);
                    pollCount++;

                    // CRITICAL FIX: Use AsNoTracking() to prevent EF caching
                    var cmd = await _context.AgentCommands
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.CommandId == command.CommandId);

                    _logger.LogInformation($"Poll #{pollCount}: Status={cmd?.Status}, HasResultData={!string.IsNullOrEmpty(cmd?.ResultData)}");

                    if (cmd?.Status == "Completed" && !string.IsNullOrEmpty(cmd.ResultData))
                    {
                        _logger.LogInformation($"Command {command.CommandId} completed successfully");

                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(cmd.ResultData);
                        return Ok(new
                        {
                            pcId = pcId,
                            rootPath = pc.LogFilePath,
                            files = result?["files"]
                        });
                    }
                    else if (cmd?.Status == "Failed")
                    {
                        _logger.LogWarning($"Command {command.CommandId} failed: {cmd.ErrorMessage}");
                        return StatusCode(500, new { error = cmd.ErrorMessage ?? "Failed to get log structure" });
                    }
                }

                _logger.LogWarning($"Timeout after {pollCount} polls for command {command.CommandId}");

                // Check final status
                var finalCmd = await _context.AgentCommands.AsNoTracking().FirstOrDefaultAsync(c => c.CommandId == command.CommandId);
                _logger.LogWarning($"Final status: {finalCmd?.Status}, HasResultData: {!string.IsNullOrEmpty(finalCmd?.ResultData)}");

                return StatusCode(408, new { error = "Request timeout - agent did not respond" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting log structure for PC {pcId}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/LogAnalyzer/file/{pcId}
        [HttpPost("file/{pcId}")]
        public async Task<ActionResult<object>> GetLogFileContent(int pcId, [FromBody] LogFileRequest request)
        {
            try
            {
                _logger.LogInformation($"GetLogFileContent requested for PC {pcId}, File: {request.FilePath}");

                var pc = await _context.FactoryPCs.FindAsync(pcId);
                if (pc == null)
                {
                    return NotFound(new { error = "PC not found" });
                }

                // Send command to agent to get file content
                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "GetLogFileContent",
                    CommandData = JsonConvert.SerializeObject(new
                    {
                        FilePath = request.FilePath
                    }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Command created: CommandId={command.CommandId}");

                // Poll for result (increased timeout to 30 seconds for large files)
                var timeout = DateTime.Now.AddSeconds(30);
                int pollCount = 0;

                while (DateTime.Now < timeout)
                {
                    await Task.Delay(500);
                    pollCount++;

                    // CRITICAL FIX: Use AsNoTracking() to prevent EF caching
                    var cmd = await _context.AgentCommands
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.CommandId == command.CommandId);

                    _logger.LogInformation($"Poll #{pollCount}: Status={cmd?.Status}");

                    if (cmd?.Status == "Completed" && !string.IsNullOrEmpty(cmd.ResultData))
                    {
                        _logger.LogInformation($"Command {command.CommandId} completed successfully");

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
                    else if (cmd?.Status == "Failed")
                    {
                        _logger.LogWarning($"Command {command.CommandId} failed");
                        return StatusCode(500, new { error = cmd.ErrorMessage ?? "Failed to read file" });
                    }
                }

                _logger.LogWarning($"Timeout after {pollCount} polls for command {command.CommandId}");
                return StatusCode(408, new { error = "Request timeout - agent did not respond" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting log file content for PC {pcId}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/LogAnalyzer/analyze/{pcId}
        [HttpPost("analyze/{pcId}")]
        public async Task<ActionResult<object>> AnalyzeLogFile(int pcId, [FromBody] LogFileRequest request)
        {
            try
            {
                _logger.LogInformation($"AnalyzeLogFile requested for PC {pcId}, File: {request.FilePath}");

                // First, get the file content
                var pc = await _context.FactoryPCs.FindAsync(pcId);
                if (pc == null)
                {
                    return NotFound(new { error = "PC not found" });
                }

                // Send command to get file content
                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "GetLogFileContent",
                    CommandData = JsonConvert.SerializeObject(new { FilePath = request.FilePath }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                // Poll for result
                var timeout = DateTime.Now.AddSeconds(30);
                string? fileContent = null;

                while (DateTime.Now < timeout)
                {
                    await Task.Delay(500);

                    // CRITICAL FIX: Use AsNoTracking()
                    var cmd = await _context.AgentCommands
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.CommandId == command.CommandId);

                    if (cmd?.Status == "Completed" && !string.IsNullOrEmpty(cmd.ResultData))
                    {
                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(cmd.ResultData);
                        fileContent = result?["content"]?.ToString();
                        break;
                    }
                    else if (cmd?.Status == "Failed")
                    {
                        return StatusCode(500, new { error = "Failed to read file for analysis" });
                    }
                }

                if (fileContent == null)
                {
                    _logger.LogWarning("Timeout reading file for analysis");
                    return StatusCode(408, new { error = "Timeout reading file" });
                }

                // Parse the log file
                var analysisResult = ParseLogFile(fileContent);

                _logger.LogInformation("Log file analyzed successfully");
                return Ok(analysisResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error analyzing log file for PC {pcId}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/LogAnalyzer/download/{pcId}
        [HttpGet("download/{pcId}")]
        public async Task<IActionResult> DownloadLogFile(int pcId, [FromQuery] string filePath)
        {
            try
            {
                var pc = await _context.FactoryPCs.FindAsync(pcId);
                if (pc == null)
                {
                    return NotFound();
                }

                var request = new LogFileRequest { FilePath = filePath };

                // Send command to get file content
                var command = new AgentCommand
                {
                    PCId = pcId,
                    CommandType = "GetLogFileContent",
                    CommandData = JsonConvert.SerializeObject(new { FilePath = request.FilePath }),
                    Status = "Pending",
                    CreatedDate = DateTime.Now
                };

                _context.AgentCommands.Add(command);
                await _context.SaveChangesAsync();

                // Poll for result
                var timeout = DateTime.Now.AddSeconds(30);
                while (DateTime.Now < timeout)
                {
                    await Task.Delay(500);

                    // CRITICAL FIX: Use AsNoTracking()
                    var cmd = await _context.AgentCommands
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.CommandId == command.CommandId);

                    if (cmd?.Status == "Completed" && !string.IsNullOrEmpty(cmd.ResultData))
                    {
                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(cmd.ResultData);
                        var content = result?["content"]?.ToString() ?? "";
                        var bytes = Encoding.UTF8.GetBytes(content);
                        return File(bytes, "text/plain", Path.GetFileName(request.FilePath));
                    }
                    else if (cmd?.Status == "Failed")
                    {
                        return StatusCode(500);
                    }
                }

                return StatusCode(408);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error downloading log file for PC {pcId}");
                return StatusCode(500);
            }
        }

        // Helper method to parse log file and extract barrel data
        private object ParseLogFile(string content)
        {
            var barrels = new List<object>();
            var barrelMap = new Dictionary<string, BarrelData>();

            var lines = content.Split('\n');
            bool headerSkipped = false;

            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                // Skip header
                if (line.StartsWith("SEM_LOG_VERSION") || line.StartsWith("Datetime\t"))
                {
                    headerSkipped = true;
                    continue;
                }

                if (!headerSkipped) continue;

                try
                {
                    var columns = line.Split('\t');
                    if (columns.Length < 11) continue;

                    var datetime = columns[0].Trim();
                    var scope = columns[7].Trim();
                    var operationName = columns[8].Trim();
                    var operationStatus = columns[9].Trim();
                    var data = columns[10].Trim();

                    var barrelMatch = Regex.Match(data, @"Barrel[:\s]*\((\d+),(\d+)\)");
                    if (!barrelMatch.Success)
                    {
                        barrelMatch = Regex.Match(data, @"BarrelID\s*\[(\d+),(\d+)\]");
                    }

                    if (!barrelMatch.Success) continue;

                    var barrelId = $"({barrelMatch.Groups[1].Value},{barrelMatch.Groups[2].Value})";

                    if (operationStatus != "END") continue;

                    var timingMatch = Regex.Match(data, @"(\d+)\s*ms");
                    if (!timingMatch.Success) continue;

                    var duration = int.Parse(timingMatch.Groups[1].Value);
                    var fullOperationName = string.IsNullOrWhiteSpace(scope) ? operationName : $"{scope}_{operationName}";

                    if (!barrelMap.ContainsKey(barrelId))
                    {
                        barrelMap[barrelId] = new BarrelData { BarrelId = barrelId };
                    }

                    DateTime.TryParse(datetime, out var logTime);
                    var timestamp = (int)(logTime - DateTime.MinValue).TotalMilliseconds;

                    barrelMap[barrelId].Operations.Add(new OperationData
                    {
                        OperationName = fullOperationName,
                        StartTime = timestamp - duration,
                        EndTime = timestamp,
                        Duration = duration,
                        Sequence = barrelMap[barrelId].Operations.Count + 1
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to parse log line: {ex.Message}");
                    continue;
                }
            }

            // Build result
            foreach (var kvp in barrelMap)
            {
                var barrel = kvp.Value;
                barrel.TotalExecutionTime = barrel.Operations.Sum(op => op.Duration);

                barrels.Add(new
                {
                    barrelId = barrel.BarrelId,
                    totalExecutionTime = barrel.TotalExecutionTime,
                    operations = barrel.Operations.Select(op => new
                    {
                        operationName = op.OperationName,
                        startTime = op.StartTime,
                        endTime = op.EndTime,
                        duration = op.Duration,
                        sequence = op.Sequence
                    }).ToList()
                });
            }

            // Calculate summary
            var totalBarrels = barrels.Count;
            var avgTime = barrels.Any() ? barrels.Average(b => ((dynamic)b).totalExecutionTime) : 0;
            var minTime = barrels.Any() ? barrels.Min(b => ((dynamic)b).totalExecutionTime) : 0;
            var maxTime = barrels.Any() ? barrels.Max(b => ((dynamic)b).totalExecutionTime) : 0;

            return new
            {
                barrels = barrels,
                summary = new
                {
                    totalBarrels = totalBarrels,
                    averageExecutionTime = avgTime,
                    minExecutionTime = minTime,
                    maxExecutionTime = maxTime
                }
            };
        }
    }

    // Helper classes
    internal class BarrelData
    {
        public string BarrelId { get; set; } = "";
        public int TotalExecutionTime { get; set; }
        public List<OperationData> Operations { get; set; } = new List<OperationData>();
    }

    internal class OperationData
    {
        public string OperationName { get; set; } = "";
        public int StartTime { get; set; }
        public int EndTime { get; set; }
        public int Duration { get; set; }
        public int Sequence { get; set; }
    }

    // Request DTOs
    public class LogFileRequest
    {
        public string FilePath { get; set; } = "";
    }
}