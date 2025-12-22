#include "../include/services/LogService.h"
#include "../include/network/HttpClient.h"
#include "../include/utilities/FileUtils.h"
#include "../include/common/Constants.h"
#include <windows.h>

LogService::LogService(AgentSettings* settings, HttpClient* client) {
    settings_ = settings;
    httpClient_ = client;
}

LogService::~LogService() {
}

void LogService::SyncLogsToServer() {
    if (!FileUtils::FolderExists(settings_->logFilePath)) {
        return;
    }

    std::string searchPath = settings_->logFilePath + "\\*.*";
    WIN32_FIND_DATAA findData;
    HANDLE hFind = FindFirstFileA(searchPath.c_str(), &findData);

    if (hFind == INVALID_HANDLE_VALUE) {
        return;
    }

    do {
        if (!(findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) {
            std::string logFilePath = settings_->logFilePath + "\\" + findData.cFileName;
            std::string logContent;

            if (FileUtils::ReadFileContent(logFilePath, logContent) && !logContent.empty()) {
                json request;
                request["pcId"] = settings_->pcId;
                request["logContent"] = logContent;
                request["logFileName"] = findData.cFileName;

                json response;
                httpClient_->Post(AgentConstants::ENDPOINT_UPDATE_LOG, request, response);

                break;
            }
        }
    } while (FindNextFileA(hFind, &findData));

    FindClose(hFind);
}