#include "../include/monitoring/ConfigManager.h"
#include "../include/utilities/FileUtils.h"
#include "../include/utilities/StringUtils.h"
#include <sstream>
#include <regex>

ConfigManager::ConfigManager() {
}

ConfigManager::~ConfigManager() {
}

bool ConfigManager::LoadConfig(const std::string& configPath) {
    std::string content;
    if (!FileUtils::ReadFileContent(configPath, content)) {
        return false;
    }

    std::istringstream stream(content);
    std::string line;

    while (std::getline(stream, line)) {
        size_t pos = line.find('=');
        if (pos != std::string::npos) {
            std::string key = line.substr(0, pos);
            std::string value = line.substr(pos + 1);

            key = StringUtils::Trim(key);
            value = StringUtils::Trim(value);

            settings_[key] = value;
        }
    }

    return true;
}

bool ConfigManager::SaveConfig(const std::string& configPath) {
    std::ostringstream stream;

    std::map<std::string, std::string>::iterator it;
    for (it = settings_.begin(); it != settings_.end(); ++it) {
        stream << it->first << "=" << it->second << "\n";
    }

    return FileUtils::WriteFileContent(configPath, stream.str());
}

std::string ConfigManager::GetValue(const std::string& key) const {
    std::map<std::string, std::string>::const_iterator it = settings_.find(key);
    if (it != settings_.end()) {
        return it->second;
    }
    return "";
}

void ConfigManager::SetValue(const std::string& key, const std::string& value) {
    settings_[key] = value;
}

bool ConfigManager::ParseConfigFile(const std::string& filePath, std::string& content) {
    return FileUtils::ReadFileContent(filePath, content);
}

bool ConfigManager::WriteConfigFile(const std::string& filePath, const std::string& content) {
    return FileUtils::WriteFileContent(filePath, content);
}

std::string ConfigManager::GetCurrentModel(const std::string& configContent) {
    std::regex modelRegex(R"(\[current_model\]\s*model\s*=\s*([^\s\r\n]+))");
    std::smatch match;

    if (std::regex_search(configContent, match, modelRegex)) {
        return match[1].str();
    }

    return "";
}

bool ConfigManager::UpdateCurrentModel(std::string& configContent, const std::string& modelName, const std::string& modelPath) {
    std::regex modelRegex(R"((\[current_model\]\s*model\s*=\s*)(.*))");
    configContent = std::regex_replace(configContent, modelRegex, "$1" + modelName);

    std::regex pathRegex(R"((model_path\s*=\s*)([^\r\n]+))");
    configContent = std::regex_replace(configContent, pathRegex, "$1" + modelPath);

    return true;
}