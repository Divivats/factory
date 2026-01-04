namespace FactoryMonitoringWeb.Models.DTOs
{
    public class AgentRegistrationRequest
    {
        public int LineNumber { get; set; }
        public int PCNumber { get; set; }
        public string IPAddress { get; set; } = string.Empty;
        public string ConfigFilePath { get; set; } = string.Empty;

        // Renamed from LogFolderPath to match C++ "logFilePath"
        public string LogFolderPath { get; set; } = string.Empty;

        public string ModelFolderPath { get; set; } = string.Empty;
        public string ModelVersion { get; set; } = "3.5";

        // Added missing fields sent by Agent
        public string ExeName { get; set; } = string.Empty;
        public string LogStructureJson { get; set; } = string.Empty;
    }

    public class AgentRegistrationResponse
    {
        public bool Success { get; set; }
        public int PCId { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class LogStructureSyncRequest
    {
        public int PCId { get; set; }
        // Renamed to match Registration DTO and C++ key "logStructureJson"
        public string LogStructureJson { get; set; } = string.Empty;
    }

    // Heartbeat Request/Response
    public class HeartbeatRequest
    {
        public int PCId { get; set; }
        public bool IsApplicationRunning { get; set; }
    }

    public class HeartbeatResponse
    {
        public bool Success { get; set; }
        public bool HasPendingCommands { get; set; }
        public List<CommandInfo> Commands { get; set; } = new List<CommandInfo>();
    }

    public class CommandInfo
    {
        public int CommandId { get; set; }
        public string CommandType { get; set; } = string.Empty;
        public string? CommandData { get; set; }
    }

    // Config Update Request
    public class ConfigUpdateRequest
    {
        public int PCId { get; set; }
        public string ConfigContent { get; set; } = string.Empty;
    }

    // REMOVED DEAD CODE: LogUpdateRequest
    // Agent now uses LogStructureSyncRequest to sync the folder tree.
    // Individual file content is fetched via CommandResultRequest (GetLogFileContent).

    // Model Sync Request
    public class ModelSyncRequest
    {
        public int PCId { get; set; }
        public List<ModelInfo> Models { get; set; } = new List<ModelInfo>();
    }

    public class ModelInfo
    {
        public string ModelName { get; set; } = string.Empty;
        public string ModelPath { get; set; } = string.Empty;
        public bool IsCurrent { get; set; }
    }

    // Command Result Request
    public class CommandResultRequest
    {
        public int CommandId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ResultData { get; set; }
        public string? ErrorMessage { get; set; }
    }

    // Generic API Response
    public class ApiResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? Data { get; set; }
    }
}