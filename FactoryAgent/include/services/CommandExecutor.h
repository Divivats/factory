#ifndef COMMAND_EXECUTOR_H
#define COMMAND_EXECUTOR_H

#include "../common/Types.h"
#include "../../third_party/json/json.hpp"

using json = nlohmann::json;

class HttpClient;
class ConfigService;
class ModelService;

class CommandExecutor {
public:
    CommandExecutor(HttpClient* client, ConfigService* configSvc, ModelService* modelSvc);
    ~CommandExecutor();

    void ProcessCommands(const json& commands);

private:
    HttpClient* httpClient_;
    ConfigService* configService_;
    ModelService* modelService_;

    bool ExecuteCommand(const json& command);
    void SendCommandResult(int commandId, const CommandResult& result);
    std::string GetLogFolderPath();
};

#endif