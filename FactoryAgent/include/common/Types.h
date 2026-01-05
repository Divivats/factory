#ifndef TYPES_H
#define TYPES_H

#include <string>
#include <vector>

struct AgentSettings {
    int pcId;
    int lineNumber;
    int pcNumber;
    std::string configFilePath;
    std::string logFolderPath;
    std::string modelFolderPath;
    std::string modelVersion;
    std::string ipAddress;       // <--- THIS WAS MISSING
    std::wstring serverUrl;
    std::wstring exeName;

    AgentSettings() {
        pcId = 0;
        lineNumber = 0;
        pcNumber = 0;
        modelVersion = "3.5";
        ipAddress = "";          // Initialize it
    }
};

struct AgentStatus {
    bool isConnected;
    int pcId;
    int lineNumber;
    int connectionFailures;
};

struct CommandResult {
    int commandId;
    bool success;
    std::string status;
    std::string resultData;
    std::string errorMessage;

    CommandResult() {
        commandId = 0;
        success = false;
    }
};

struct ModelInfo {
    std::string modelName;
    std::string modelPath;
    bool isCurrent;

    ModelInfo() {
        isCurrent = false;
    }
};

#endif