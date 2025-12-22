#ifndef TYPES_H
#define TYPES_H

/*
 * Types.h
 * Common data structures used throughout the agent
 */

#include <string>
#include <vector>

struct AgentSettings {
    int pcId;
    int lineNumber;
    int pcNumber;
    std::string configFilePath;
    std::string logFilePath;
    std::string modelFolderPath;
    std::string modelVersion;
    std::wstring serverUrl;

    AgentSettings() {
        pcId = 0;
        lineNumber = 0;
        pcNumber = 0;
        // Default model version if not chosen yet
        modelVersion = "3.5";
    }
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