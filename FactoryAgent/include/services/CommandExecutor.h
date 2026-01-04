#ifndef COMMAND_EXECUTOR_H
#define COMMAND_EXECUTOR_H

#include <string>
#include "../../third_party/json/json.hpp"

// Forward declarations
class HttpClient;
class ConfigService;
class ModelService;

using json = nlohmann::json;

// Command structure
struct Command
{
    int commandId;
    std::string commandType;
    std::string commandData;
};

class CommandExecutor
{
public:
    // Constructor matching your AgentCore usage
    CommandExecutor(HttpClient* httpClient, ConfigService* configService, ModelService* modelService);
    ~CommandExecutor();

    /**
     * Process commands received from the server
     * Called by AgentCore after heartbeat
     * @param commands JSON array of commands from server
     */
    void ProcessCommands(const json& commands);

private:
    HttpClient* httpClient_;
    ConfigService* configService_;
    ModelService* modelService_;

    /**
     * Execute a single command
     * @param command Command to execute
     */
    void Execute(const Command& command);

    // Command handlers
    void HandleUpdateConfig(const Command& command);
    void HandleChangeModel(const Command& command);
    void HandleDownloadModel(const Command& command);
    void HandleDeleteModel(const Command& command);
    void HandleUploadModel(const Command& command);
    void HandleGetLogFileContent(const Command& command);

    // Helper methods
    void SendCommandResult(int commandId, const std::string& status, const std::string& resultData);
    std::string GetConfigFilePath();
    std::string GetModelFolderPath();
    std::string GetLogFolderPath();
};

#endif // COMMAND_EXECUTOR_H