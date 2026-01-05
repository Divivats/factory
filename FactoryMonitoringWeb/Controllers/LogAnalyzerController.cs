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

        [HttpGet("structure/{pcId}")]
        public async Task<ActionResult<object>> GetLogStructure(int pcId)
        {
            var pc = await _context.FactoryPCs.FindAsync(pcId);
            if (pc == null) return NotFound(new { error = "PC not found" });

            string rawJson = string.IsNullOrEmpty(pc.LogStructureJson) ? "[]" : pc.LogStructureJson;

            // 2. Manually construct the wrapper JSON string
            // Use proper escaping for rootPath to prevent invalid JSON
            string responseJson = $@"{{
                ""pcId"": {pcId},
                ""rootPath"": {JsonConvert.ToString(pc.LogFolderPath)}, 
                ""files"": {rawJson}
            }}";

            return Content(responseJson, "application/json");
        }

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
        private static string? ExtractJson(string line)
        {
            int first = line.IndexOf('{');
            int last = line.LastIndexOf('}');
            if (first >= 0 && last > first)
                return line.Substring(first, last - first + 1);
            return null;
        }

        private static string NormalizeJson(string json)
        {
            // Convert single-quote pseudo JSON → valid JSON
            if (json.Contains('\'') && !json.Contains('"'))
                json = json.Replace('\'', '"');

            // Fix broken patterns like {"barrelId":1,{ "StartTs":9024.00}
            json = Regex.Replace(json, @"\{""barrelId"":(\d+),\{", m =>
            {
                return $@"{{""barrelId"":{m.Groups[1].Value},";
            });

            return json;
        }

        private static int? ReadTimestampMs(JObject json, params string[] keys)
        {
            foreach (var key in keys)
            {
                var prop = json.Properties()
                    .FirstOrDefault(p => p.Name.Equals(key, StringComparison.OrdinalIgnoreCase));

                if (prop != null && double.TryParse(prop.Value.ToString(), out var d))
                    return (int)Math.Floor(d); // ms → int
            }
            return null;
        }

        private object ParseEnhancedLogFile(string content)
        {
            var barrelMap = new Dictionary<string, BarrelData>();
            var startMap = new Dictionary<string, Dictionary<string, int>>();

            var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            var opRegex = new Regex(@"\b(Sequence_[^\s]+)\s+(START|END)\b", RegexOptions.IgnoreCase);

            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                if (line.StartsWith("SEM_LOG_VERSION") || line.StartsWith("DateTime")) continue;

                string? operationName = null;
                string? status = null;

                var match = opRegex.Match(line);
                if (match.Success)
                {
                    operationName = match.Groups[1].Value;
                    status = match.Groups[2].Value.ToUpperInvariant();
                }
                else
                {
                    var tabs = line.Split('\t');
                    if (tabs.Length >= 11)
                    {
                        operationName = tabs[8].Trim();
                        status = tabs[9].Trim().ToUpperInvariant();
                    }
                    else
                    {
                        continue;
                    }
                }

                // -------- JSON --------
                var jsonText = ExtractJson(line);
                if (jsonText == null) continue;

                jsonText = NormalizeJson(jsonText);

                JObject json;
                try { json = JObject.Parse(jsonText); }
                catch { continue; }

                // -------- BarrelId --------
                var barrelProp = json.Properties()
                    .FirstOrDefault(p => p.Name.Equals("barrelId", StringComparison.OrdinalIgnoreCase));

                if (barrelProp == null) continue;

                string barrelId = barrelProp.Value.ToString();

                if (!barrelMap.ContainsKey(barrelId))
                {
                    barrelMap[barrelId] = new BarrelData { BarrelId = barrelId };
                    startMap[barrelId] = new Dictionary<string, int>();
                }

                // -------- Timestamps --------
                int? startTs = ReadTimestampMs(json, "startTs", "StartTs");
                int? endTs = ReadTimestampMs(json, "endTs", "EndTs");
                int idealMs = ReadTimestampMs(json, "idealMs", "IdealTs") ?? 0;

                // -------- START --------
                if (status == "START" && startTs.HasValue)
                {
                    startMap[barrelId][operationName] = startTs.Value;
                }
                // -------- END --------
                else if (status == "END" && endTs.HasValue)
                {
                    if (!startMap[barrelId].TryGetValue(operationName, out var start))
                        continue;

                    if (endTs.Value < start) continue;

                    var barrel = barrelMap[barrelId];

                    barrel.Operations.Add(new OperationData
                    {
                        OperationName = operationName,
                        StartTime = start,
                        EndTime = endTs.Value,
                        ActualDuration = endTs.Value - start,
                        IdealDuration = idealMs,
                        Sequence = barrel.Operations.Count + 1
                    });

                    startMap[barrelId].Remove(operationName);
                }
            }

            // -------- Total execution time --------
            foreach (var barrel in barrelMap.Values)
            {
                if (barrel.Operations.Any())
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