// Enhanced Log Analyzer Commands - Samsung Industry Grade
// Location: src/services/LogAnalyzerCommands.cpp
// Handles new JSON-enhanced log format

#include "../include/services/LogAnalyzerCommands.h"
#include "../include/utilities/FileUtils.h"
#include "../../third_party/json/json.hpp"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <vector>
#include <map>
#include <regex>
#include <windows.h>

using json = nlohmann::json;
namespace fs = std::filesystem;

namespace LogAnalyzer
{
    // Convert wide string to UTF-8 string
    std::string WStringToString(const std::wstring& wstr)
    {
        if (wstr.empty()) return std::string();

        int size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
        std::string strTo(size_needed, 0);
        WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
        return strTo;
    }

    // Convert UTF-8 string to wide string
    std::wstring StringToWString(const std::string& str)
    {
        if (str.empty()) return std::wstring();

        int size_needed = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), NULL, 0);
        std::wstring wstrTo(size_needed, 0);
        MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstrTo[0], size_needed);
        return wstrTo;
    }

    // Build hierarchical file tree recursively
    json BuildFileTree(const std::wstring& rootPath, const std::wstring& relativePath)
    {
        json result = json::array();

        try
        {
            std::wstring fullPath = relativePath.empty() ? rootPath : rootPath + L"\\" + relativePath;

            // Check if path exists and is a directory
            if (!fs::exists(fullPath) || !fs::is_directory(fullPath))
            {
                return result;
            }

            // Iterate through directory entries
            for (const auto& entry : fs::directory_iterator(fullPath))
            {
                try
                {
                    json node;

                    std::wstring name = entry.path().filename().wstring();
                    std::wstring path = relativePath.empty() ? name : relativePath + L"\\" + name;

                    node["name"] = WStringToString(name);
                    node["path"] = WStringToString(path);
                    node["isDirectory"] = entry.is_directory();

                    if (entry.is_regular_file())
                    {
                        // Get file size
                        node["size"] = entry.file_size();

                        // Get last modified time
                        auto ftime = fs::last_write_time(entry);
                        auto sctp = std::chrono::time_point_cast<std::chrono::system_clock::duration>(
                            ftime - fs::file_time_type::clock::now() + std::chrono::system_clock::now()
                        );
                        auto time = std::chrono::system_clock::to_time_t(sctp);

                        char timeStr[100];
                        struct tm timeinfo;
                        localtime_s(&timeinfo, &time);
                        strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", &timeinfo);
                        node["modifiedDate"] = timeStr;
                    }
                    else if (entry.is_directory())
                    {
                        // Recursively build children
                        node["children"] = BuildFileTree(rootPath, path);
                    }

                    result.push_back(node);
                }
                catch (const std::exception& ex)
                {
                    // Skip files that can't be accessed
                    continue;
                }
            }
        }
        catch (const std::exception& ex)
        {
            // Return empty array on error
        }

        return result;
    }

    // Handle GetLogStructure command
    std::string HandleGetLogStructure(const std::string& commandData)
    {
        try
        {
            json cmdJson = json::parse(commandData);
            std::string logPath = cmdJson["LogPath"];
            std::wstring wLogPath = StringToWString(logPath);

            // Build file tree
            json fileTree = BuildFileTree(wLogPath);

            // Build result
            json result;
            result["success"] = true;
            result["files"] = fileTree;

            return result.dump();
        }
        catch (const std::exception& ex)
        {
            json error;
            error["success"] = false;
            error["error"] = ex.what();
            return error.dump();
        }
    }

    // Handle GetLogFileContent command
    std::string HandleGetLogFileContent(const std::string& commandData)
    {
        try
        {
            json cmdJson = json::parse(commandData);
            std::string filePath = cmdJson["FilePath"];

            // Convert to wide string for Windows file operations
            std::wstring wFilePath = StringToWString(filePath);

            // Open file
            std::ifstream file(wFilePath, std::ios::binary);
            if (!file.is_open())
            {
                json error;
                error["success"] = false;
                error["error"] = "Failed to open file: " + filePath;
                return error.dump();
            }

            // Get file size
            file.seekg(0, std::ios::end);
            size_t fileSize = file.tellg();
            file.seekg(0, std::ios::beg);

            // Read content
            std::string content;
            content.resize(fileSize);
            file.read(&content[0], fileSize);
            file.close();

            // Build result
            json result;
            result["success"] = true;
            result["content"] = content;
            result["size"] = fileSize;
            result["encoding"] = "UTF-8";

            return result.dump();
        }
        catch (const std::exception& ex)
        {
            json error;
            error["success"] = false;
            error["error"] = ex.what();
            return error.dump();
        }
    }

    // NEW: Enhanced parsing for JSON-based log format
    std::string HandleAnalyzeLog(const std::string& commandData)
    {
        try
        {
            json cmdJson = json::parse(commandData);
            std::string fileContent = cmdJson["content"];

            std::map<std::string, json> barrelMap;  // barrelId -> barrel data
            std::map<std::string, std::map<std::string, json>> operationStarts;  // barrelId -> operationName -> START data

            std::istringstream stream(fileContent);
            std::string line;
            bool headerSkipped = false;

            while (std::getline(stream, line))
            {
                if (line.empty()) continue;

                // Skip header
                if (line.find("SEM_LOG_VERSION") != std::string::npos ||
                    line.find("Datetime\t") != std::string::npos)
                {
                    headerSkipped = true;
                    continue;
                }

                if (!headerSkipped) continue;

                try
                {
                    // Split by tab
                    std::vector<std::string> columns;
                    std::istringstream lineStream(line);
                    std::string column;

                    while (std::getline(lineStream, column, '\t'))
                    {
                        columns.push_back(column);
                    }

                    if (columns.size() < 10) continue;

                    // Extract fields
                    std::string datetime = columns[0];
                    std::string scope = columns.size() > 7 ? columns[7] : "";
                    std::string operationName = columns.size() > 8 ? columns[8] : "";
                    std::string operationStatus = columns.size() > 9 ? columns[9] : "";
                    std::string dataField = columns.size() > 10 ? columns[10] : "";

                    // Skip if no data field
                    if (dataField.empty()) continue;

                    // Parse JSON from data field
                    json dataJson;
                    try
                    {
                        dataJson = json::parse(dataField);
                    }
                    catch (...)
                    {
                        // Not valid JSON, skip
                        continue;
                    }

                    if (!dataJson.contains("barrelId")) continue;

                    std::string barrelId = dataJson["barrelId"];
                    std::string fullOpName = scope.empty() ? operationName : scope + "_" + operationName;

                    // Initialize barrel if not exists
                    if (barrelMap.find(barrelId) == barrelMap.end())
                    {
                        barrelMap[barrelId] = json::object();
                        barrelMap[barrelId]["barrelId"] = barrelId;
                        barrelMap[barrelId]["totalExecutionTime"] = 0;
                        barrelMap[barrelId]["operations"] = json::array();
                    }

                    if (operationStatus == "START")
                    {
                        // Store START data for later pairing
                        operationStarts[barrelId][fullOpName] = dataJson;
                    }
                    else if (operationStatus == "END")
                    {
                        // Find matching START
                        if (operationStarts.find(barrelId) != operationStarts.end() &&
                            operationStarts[barrelId].find(fullOpName) != operationStarts[barrelId].end())
                        {
                            json startData = operationStarts[barrelId][fullOpName];

                            int startTs = startData.value("startTs", 0);
                            int endTs = dataJson.value("endTs", 0);
                            int actualMs = dataJson.value("actualMs", 0);
                            int idealMs = dataJson.value("idealMs", 100);  // Default 100ms

                            // Create operation entry
                            json operation;
                            operation["operationName"] = fullOpName;
                            operation["startTime"] = startTs;
                            operation["endTime"] = endTs;
                            operation["actualDuration"] = actualMs;
                            operation["idealDuration"] = idealMs;
                            operation["sequence"] = barrelMap[barrelId]["operations"].size() + 1;

                            barrelMap[barrelId]["operations"].push_back(operation);
                            barrelMap[barrelId]["totalExecutionTime"] =
                                barrelMap[barrelId]["totalExecutionTime"].get<int>() + actualMs;

                            // Remove START entry
                            operationStarts[barrelId].erase(fullOpName);
                        }
                    }
                }
                catch (const std::exception& ex)
                {
                    // Skip problematic lines
                    continue;
                }
            }

            // Build final result
            json barrels = json::array();
            int totalTime = 0;
            int minTime = INT_MAX;
            int maxTime = 0;

            for (auto& pair : barrelMap)
            {
                json barrel = pair.second;
                int execTime = barrel["totalExecutionTime"];

                barrels.push_back(barrel);
                totalTime += execTime;

                if (execTime < minTime) minTime = execTime;
                if (execTime > maxTime) maxTime = execTime;
            }

            json summary;
            summary["totalBarrels"] = barrels.size();
            summary["averageExecutionTime"] = barrels.size() > 0 ? (double)totalTime / barrels.size() : 0;
            summary["minExecutionTime"] = minTime == INT_MAX ? 0 : minTime;
            summary["maxExecutionTime"] = maxTime;

            json result;
            result["success"] = true;
            result["barrels"] = barrels;
            result["summary"] = summary;

            return result.dump();
        }
        catch (const std::exception& ex)
        {
            json error;
            error["success"] = false;
            error["error"] = std::string("Analysis failed: ") + ex.what();
            return error.dump();
        }
    }
}