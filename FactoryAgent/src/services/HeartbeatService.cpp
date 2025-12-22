#include "../include/services/HeartbeatService.h"
#include "../include/common/Constants.h"

HeartbeatService::HeartbeatService() {
}

HeartbeatService::~HeartbeatService() {
}

bool HeartbeatService::SendHeartbeat(int pcId, bool isAppRunning, HttpClient* client, json* commands) {
    if (client == NULL) {
        return false;
    }

    json request = BuildHeartbeatRequest(pcId, isAppRunning);
    json response;

    if (client->Post(AgentConstants::ENDPOINT_HEARTBEAT, request, response)) {
        if (ParseHeartbeatResponse(response, commands)) {
            return true;
        }
    }

    return false;
}

json HeartbeatService::BuildHeartbeatRequest(int pcId, bool isAppRunning) {
    json request;
    request["pcId"] = pcId;
    request["isApplicationRunning"] = isAppRunning;
    return request;
}

bool HeartbeatService::ParseHeartbeatResponse(const json& response, json* commands) {
    if (response.contains("success") && response["success"].get<bool>()) {
        if (commands != NULL && response.contains("hasPendingCommands") &&
            response["hasPendingCommands"].get<bool>()) {
            if (response.contains("commands")) {
                *commands = response["commands"];
            }
        }
        return true;
    }
    return false;
}