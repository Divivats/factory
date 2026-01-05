#ifndef LOG_ANALYZER_COMMANDS_H
#define LOG_ANALYZER_COMMANDS_H

#include <string>
#include "../../third_party/json/json.hpp"

using json = nlohmann::json;

namespace LogAnalyzer
{
    std::string HandleGetLogFileContent(const std::string& commandData);
    json BuildFileTree(const std::wstring& rootPath, const std::wstring& relativePath = L"");
    std::string WStringToString(const std::wstring& wstr);
    std::wstring StringToWString(const std::string& str);
}

#endif