#ifndef HEARTBEAT_SERVICE_H
#define HEARTBEAT_SERVICE_H

#include "../common/Types.h"
#include "../network/HttpClient.h"
#include "../../third_party/json/json.hpp"

using json = nlohmann::json;

class HeartbeatService {
public:
    HeartbeatService();
    ~HeartbeatService();

    bool SendHeartbeat(int pcId, bool isAppRunning, HttpClient* client, json* commands);

private:
    json BuildHeartbeatRequest(int pcId, bool isAppRunning);
    bool ParseHeartbeatResponse(const json& response, json* commands);

    HeartbeatService(const HeartbeatService&);
    HeartbeatService& operator=(const HeartbeatService&);
};

#endif