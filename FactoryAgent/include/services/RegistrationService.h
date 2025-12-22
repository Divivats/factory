#ifndef REGISTRATION_SERVICE_H
#define REGISTRATION_SERVICE_H

/*
 * RegistrationService.h
 * Handles agent registration with the server
 * Single Responsibility: Registration only
 */

#include "../common/Types.h"
#include "../network/HttpClient.h"
#include "../../third_party/json/json.hpp"

using json = nlohmann::json;

class RegistrationService {
public:
    RegistrationService();
    ~RegistrationService();

    bool RegisterWithServer(AgentSettings* settings, HttpClient* client);

private:
    json BuildRegistrationRequest(AgentSettings* settings);
    bool ParseRegistrationResponse(const json& response, int* pcId);

    RegistrationService(const RegistrationService&);
    RegistrationService& operator=(const RegistrationService&);
};

#endif