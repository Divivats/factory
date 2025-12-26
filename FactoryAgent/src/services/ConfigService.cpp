// Config Service - OPTIMIZED Implementation
// Location: src/ConfigService.cpp
// OPTIMIZATION: Only sync when config actually changes (hash comparison)

#include "../include/services/ConfigService.h"
#include "../include/network/HttpClient.h"
#include "../include/utilities/FileUtils.h"
#include "../include/common/Constants.h"
#include <windows.h>

ConfigService::ConfigService(AgentSettings* settings, HttpClient* client, ConfigManager* configMgr) {
    settings_ = settings;
    httpClient_ = client;
    configManager_ = configMgr;
}

ConfigService::~ConfigService() {
}

void ConfigService::SyncConfigToServer() {
    std::string configContent;
    if (!FileUtils::ReadFileContent(settings_->configFilePath, configContent)) {
        return;
    }

    // OPTIMIZATION: Only sync if config has changed
    if (configContent.empty() || configContent == lastConfigContent_) {
        return;
    }

    lastConfigContent_ = configContent;

    json request;
    request["pcId"] = settings_->pcId;
    request["configContent"] = configContent;

    json response;
    // Non-blocking: don't wait for response
    httpClient_->Post(AgentConstants::ENDPOINT_UPDATE_CONFIG, request, response);
}

bool ConfigService::ApplyConfigFromServer(const std::string& content) {
    if (content.empty()) {
        return false;
    }

    // Write config file
    if (configManager_->WriteConfigFile(settings_->configFilePath, content)) {
        lastConfigContent_ = content;
        return true;
    }

    return false;
}