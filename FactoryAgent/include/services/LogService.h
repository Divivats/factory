#ifndef LOG_SERVICE_H
#define LOG_SERVICE_H

/*
 * LogService.h
 * Handles log file operations
 * Single Responsibility: Log management only
 */

#include "../common/Types.h"
#include "../../third_party/json/json.hpp"

using json = nlohmann::json;

class HttpClient;

class LogService {
public:
    LogService(AgentSettings* settings, HttpClient* client);
    ~LogService();

    void SyncLogsToServer();

private:
    AgentSettings* settings_;
    HttpClient* httpClient_;

    LogService(const LogService&);
    LogService& operator=(const LogService&);
};

#endif