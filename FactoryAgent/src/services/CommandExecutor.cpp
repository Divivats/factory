#include "../include/services/CommandExecutor.h"
#include "../include/services/ConfigService.h"
#include "../include/services/ModelService.h"
#include "../include/network/HttpClient.h"
#include "../include/common/Constants.h"

CommandExecutor::CommandExecutor(HttpClient* client, ConfigService* configSvc, ModelService* modelSvc) {
    httpClient_ = client;
    configService_ = configSvc;
    modelService_ = modelSvc;
}

CommandExecutor::~CommandExecutor() {
}

void CommandExecutor::ProcessCommands(const json& commands) {
    if (!commands.is_array()) {
        return;
    }

    int count = commands.size();
    for (int i = 0; i < count; i++) {
        ExecuteCommand(commands[i]);
    }
}

bool CommandExecutor::ExecuteCommand(const json& command) {
    if (!command.contains("commandId") || !command.contains("commandType")) {
        return false;
    }

    int commandId = command["commandId"].get<int>();
    std::string commandType = command["commandType"].get<std::string>();

    CommandResult result;
    result.commandId = commandId;
    result.success = false;
    result.status = AgentConstants::STATUS_FAILED;

    if (commandType == AgentConstants::COMMAND_UPDATE_CONFIG) {
        if (command.contains("commandData")) {
            std::string configContent = command["commandData"].get<std::string>();
            if (configService_->ApplyConfigFromServer(configContent)) {
                result.success = true;
                result.status = AgentConstants::STATUS_COMPLETED;
            }
        }
    }
    else if (commandType == AgentConstants::COMMAND_CHANGE_MODEL) {
        if (command.contains("commandData")) {
            json data = json::parse(command["commandData"].get<std::string>());
            if (data.contains("ModelName")) {
                std::string modelName = data["ModelName"].get<std::string>();
                if (modelService_->ChangeModel(modelName)) {
                    result.success = true;
                    result.status = AgentConstants::STATUS_COMPLETED;
                }
            }
        }
    }
    else if (commandType == AgentConstants::COMMAND_UPLOAD_MODEL) {
        if (command.contains("commandData")) {
            json data = json::parse(command["commandData"].get<std::string>());
            if (modelService_->UploadModelToServer(data)) {
                result.success = true;
                result.status = AgentConstants::STATUS_COMPLETED;
            }
        }
    }
    else if (commandType == AgentConstants::COMMAND_DELETE_MODEL) {
        if (command.contains("commandData")) {
            json data = json::parse(command["commandData"].get<std::string>());
            if (data.contains("ModelName")) {
                std::string modelName = data["ModelName"].get<std::string>();
                if (modelService_->DeleteModel(modelName)) {
                    result.success = true;
                    result.status = AgentConstants::STATUS_COMPLETED;
                }
            }
        }
    }
    else if (commandType == AgentConstants::COMMAND_DOWNLOAD_MODEL) {
        if (command.contains("commandData")) {
            json data = json::parse(command["commandData"].get<std::string>());
            if (data.contains("ModelName")) {
                std::string modelName = data["ModelName"].get<std::string>();
                if (modelService_->DownloadModelFromAgent(modelName)) {
                    result.success = true;
                    result.status = AgentConstants::STATUS_COMPLETED;
                }
            }
        }
    }

    SendCommandResult(commandId, result);
    return result.success;
}

void CommandExecutor::SendCommandResult(int commandId, const CommandResult& result) {
    json request;
    request["commandId"] = commandId;
    request["status"] = result.status;
    request["resultData"] = result.resultData;
    request["errorMessage"] = result.errorMessage;

    json response;
    httpClient_->Post(AgentConstants::ENDPOINT_COMMAND_RESULT, request, response);
}