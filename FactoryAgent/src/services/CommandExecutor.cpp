#include "../include/services/CommandExecutor.h"
#include "../include/services/LogAnalyzerCommands.h"
#include "../include/services/ConfigService.h"
#include "../include/services/ModelService.h"
#include "../include/network/HttpClient.h"
#include "../include/utilities/FileUtils.h"
#include "../include/utilities/StringUtils.h"
#include "../include/common/Constants.h"
#include <fstream>
#include <filesystem>
#include <windows.h>

namespace fs = std::filesystem;

CommandExecutor::CommandExecutor(HttpClient* httpClient, ConfigService* configService, ModelService* modelService)
    : httpClient_(httpClient)
    , configService_(configService)
    , modelService_(modelService)
{
}

CommandExecutor::~CommandExecutor()
{
    // Don't delete httpClient_, configService_, modelService_ - they're owned by AgentCore
}

void CommandExecutor::ProcessCommands(const json& commands)
{
    if (!commands.is_array())
    {
        return;
    }

    for (const auto& cmdJson : commands)
    {
        try
        {
            Command command;
            command.commandId = cmdJson.value("commandId", 0);
            command.commandType = cmdJson.value("commandType", "");
            command.commandData = cmdJson.value("commandData", "");

            // Execute command in a separate thread to avoid blocking heartbeat
            Execute(command);
        }
        catch (const std::exception& ex)
        {
            // Log error but continue processing other commands
        }
    }
}

void CommandExecutor::Execute(const Command& command)
{
    std::string result;
    std::string status = "Completed";

    try
    {
        // Route to appropriate handler based on command type
        if (command.commandType == "UpdateConfig")
        {
            HandleUpdateConfig(command);
        }
        else if (command.commandType == "ChangeModel")
        {
            HandleChangeModel(command);
        }
        else if (command.commandType == "DownloadModel")
        {
            HandleDownloadModel(command);
        }
        else if (command.commandType == "DeleteModel")
        {
            HandleDeleteModel(command);
        }
        else if (command.commandType == "UploadModel")
        {
            HandleUploadModel(command);
        }
        else if (command.commandType == "GetLogFileContent")
        {
            HandleGetLogFileContent(command);
        }
        else
        {
            status = "Failed";
            result = "Unknown command type: " + command.commandType;
            SendCommandResult(command.commandId, status, result);
        }
    }
    catch (const std::exception& ex)
    {
        status = "Failed";
        result = std::string("Exception: ") + ex.what();
        SendCommandResult(command.commandId, status, result);
    }
}

void CommandExecutor::HandleUpdateConfig(const Command& command)
{
    try
    {
        // Use ConfigService to handle config update
        if (configService_)
        {
            if (configService_->ApplyConfigFromServer(command.commandData))
            {
                json result;
                result["success"] = true;
                result["message"] = "Config updated successfully";
                SendCommandResult(command.commandId, "Completed", result.dump());
            }
            else
            {
                SendCommandResult(command.commandId, "Failed", "Failed to apply config");
            }
        }
        else
        {
            SendCommandResult(command.commandId, "Failed", "ConfigService not available");
        }
    }
    catch (const std::exception& ex)
    {
        SendCommandResult(command.commandId, "Failed", ex.what());
    }
}

void CommandExecutor::HandleChangeModel(const Command& command)
{
    try
    {
        json cmdJson = json::parse(command.commandData);
        std::string modelName = cmdJson["ModelName"];

        // Use ModelService to handle model change
        if (modelService_)
        {
            if (modelService_->ChangeModel(modelName))
            {
                json result;
                result["success"] = true;
                result["message"] = "Model changed to: " + modelName;
                SendCommandResult(command.commandId, "Completed", result.dump());
            }
            else
            {
                SendCommandResult(command.commandId, "Failed", "Failed to change model");
            }
        }
        else
        {
            SendCommandResult(command.commandId, "Failed", "ModelService not available");
        }
    }
    catch (const std::exception& ex)
    {
        SendCommandResult(command.commandId, "Failed", ex.what());
    }
}

void CommandExecutor::HandleDownloadModel(const Command& command)
{
    try
    {
        json cmdJson = json::parse(command.commandData);
        std::string modelName = cmdJson["ModelName"];

        // Use ModelService to upload model to server
        if (modelService_)
        {
            if (modelService_->DownloadModelFromAgent(modelName))
            {
                json result;
                result["success"] = true;
                result["message"] = "Model uploaded to server";
                SendCommandResult(command.commandId, "Completed", result.dump());
            }
            else
            {
                SendCommandResult(command.commandId, "Failed", "Failed to upload model");
            }
        }
        else
        {
            SendCommandResult(command.commandId, "Failed", "ModelService not available");
        }
    }
    catch (const std::exception& ex)
    {
        SendCommandResult(command.commandId, "Failed", ex.what());
    }
}

void CommandExecutor::HandleDeleteModel(const Command& command)
{
    try
    {
        json cmdJson = json::parse(command.commandData);
        std::string modelName = cmdJson["ModelName"];

        // Use ModelService to delete model
        if (modelService_)
        {
            if (modelService_->DeleteModel(modelName))
            {
                json result;
                result["success"] = true;
                result["message"] = "Model deleted: " + modelName;
                SendCommandResult(command.commandId, "Completed", result.dump());
            }
            else
            {
                SendCommandResult(command.commandId, "Failed", "Failed to delete model");
            }
        }
        else
        {
            SendCommandResult(command.commandId, "Failed", "ModelService not available");
        }
    }
    catch (const std::exception& ex)
    {
        SendCommandResult(command.commandId, "Failed", ex.what());
    }
}

void CommandExecutor::HandleUploadModel(const Command& command)
{
    try
    {
        json cmdJson = json::parse(command.commandData);

        // Use ModelService to download and install model
        if (modelService_)
        {
            if (modelService_->UploadModelToServer(cmdJson))
            {
                json result;
                result["success"] = true;
                result["message"] = "Model downloaded and saved";
                SendCommandResult(command.commandId, "Completed", result.dump());
            }
            else
            {
                SendCommandResult(command.commandId, "Failed", "Failed to download model");
            }
        }
        else
        {
            SendCommandResult(command.commandId, "Failed", "ModelService not available");
        }
    }
    catch (const std::exception& ex)
    {
        SendCommandResult(command.commandId, "Failed", ex.what());
    }
}

void CommandExecutor::HandleGetLogFileContent(const Command& command)
{
    try
    {
        // Parse command to get file path
        json cmdJson = json::parse(command.commandData);
        std::string filePath = cmdJson.value("FilePath", "");

        // If path is relative, combine with log folder path
        if (filePath.find(':') == std::string::npos)  // No drive letter = relative path
        {
            std::string logFolder = GetLogFolderPath();
            filePath = logFolder + "\\" + filePath;

            // Update command data with full path
            cmdJson["FilePath"] = filePath;
        }

        // Call LogAnalyzer handler
        std::string result = LogAnalyzer::HandleGetLogFileContent(cmdJson.dump());

        // Check if result indicates success
        json resultJson = json::parse(result);
        if (resultJson.value("success", false))
        {
            SendCommandResult(command.commandId, "Completed", result);
        }
        else
        {
            SendCommandResult(command.commandId, "Failed", result);
        }
    }
    catch (const std::exception& ex)
    {
        json error;
        error["success"] = false;
        error["error"] = ex.what();
        SendCommandResult(command.commandId, "Failed", error.dump());
    }
}

// ========================================================

void CommandExecutor::SendCommandResult(int commandId, const std::string& status, const std::string& resultData)
{
    if (!httpClient_)
    {
        return;
    }

    try
    {
        json payload;
        payload["commandId"] = commandId;
        payload["status"] = status;
        payload["resultData"] = resultData;

        // Send result back to server
        json response;
        httpClient_->Post(AgentConstants::ENDPOINT_COMMAND_RESULT, payload, response);
    }
    catch (const std::exception& ex)
    {
        // Silently fail - don't block command execution
    }
}

std::string CommandExecutor::GetConfigFilePath()
{
    // This will be set from AgentSettings
    // For now, return placeholder
    return "C:\\LAI\\LAI-Operational\\config.ini";
}

std::string CommandExecutor::GetModelFolderPath()
{
    // This will be set from AgentSettings
    // For now, return placeholder
    return "C:\\LAI\\LAI-Operational\\Model";
}

std::string CommandExecutor::GetLogFolderPath()
{
    // This will be set from AgentSettings
    // For now, return placeholder
    return "C:\\LAI\\LAI-WorkData\\Log";
}