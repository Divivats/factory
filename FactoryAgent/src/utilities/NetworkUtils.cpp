#include "../include/utilities/NetworkUtils.h"
#include "../include/common/Constants.h"
#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

std::string NetworkUtils::GetIPAddress() {
    char hostname[AgentConstants::MAX_HOSTNAME_LENGTH];
    if (gethostname(hostname, sizeof(hostname)) != 0) {
        return AgentConstants::DEFAULT_IP_ADDRESS;
    }

    struct addrinfo hints;
    ZeroMemory(&hints, sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;

    struct addrinfo* result = NULL;
    if (getaddrinfo(hostname, NULL, &hints, &result) == 0) {
        char ip[AgentConstants::MAX_IP_LENGTH];
        struct sockaddr_in* addr = (struct sockaddr_in*)result->ai_addr;
        inet_ntop(AF_INET, &(addr->sin_addr), ip, AgentConstants::MAX_IP_LENGTH);
        freeaddrinfo(result);
        return std::string(ip);
    }

    return AgentConstants::DEFAULT_IP_ADDRESS;
}

std::string NetworkUtils::ConvertWStringToString(const std::wstring& wstr) {
    return std::string(wstr.begin(), wstr.end());
}

std::wstring NetworkUtils::ConvertStringToWString(const std::string& str) {
    return std::wstring(str.begin(), str.end());
}