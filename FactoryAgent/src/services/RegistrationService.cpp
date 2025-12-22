#include "../include/services/RegistrationService.h"
#include "../include/common/Constants.h"
#include "../include/utilities/NetworkUtils.h"

/*
 * RegistrationService.cpp
 * Implementation of registration functionality
 * Follows SRP - handles ONLY registration logic
 */

RegistrationService::RegistrationService() {
}

RegistrationService::~RegistrationService() {
}

bool RegistrationService::RegisterWithServer(AgentSettings* settings, HttpClient* client) {
    if (settings == NULL || client == NULL) {
        return false;
    }

    json request = BuildRegistrationRequest(settings);
    json response;

    bool success = client->Post(AgentConstants::ENDPOINT_REGISTER, request, response);
    if (!success) {
        return false;
    }

    int pcId = 0;
    if (ParseRegistrationResponse(response, &pcId)) {
        settings->pcId = pcId;
        return true;
    }

    return false;
}

json RegistrationService::BuildRegistrationRequest(AgentSettings* settings) {
    json request;
    request["lineNumber"] = settings->lineNumber;
    request["pcNumber"] = settings->pcNumber;
    request["ipAddress"] = NetworkUtils::GetIPAddress();
    request["configFilePath"] = settings->configFilePath;
    request["logFilePath"] = settings->logFilePath;
    request["modelFolderPath"] = settings->modelFolderPath;
    request["modelVersion"] = settings->modelVersion;
    return request;
}

bool RegistrationService::ParseRegistrationResponse(const json& response, int* pcId) {
    if (pcId == NULL) {
        return false;
    }

    if (response.contains("success") && response["success"].get<bool>()) {
        if (response.contains("pcId")) {
            *pcId = response["pcId"].get<int>();
            return true;
        }
    }

    return false;
}