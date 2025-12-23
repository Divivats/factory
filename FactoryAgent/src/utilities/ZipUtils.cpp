#include "../include/utilities/ZipUtils.h"
#include "../include/utilities/FileUtils.h"

bool ZipUtils::ExtractZip(const std::string& zipPath, const std::string& destinationPath) {
    if (!FileUtils::FileExists(zipPath)) {
        return false;
    }

    if (!FileUtils::FolderExists(destinationPath)) {
        FileUtils::CreateFolder(destinationPath);
    }

    std::string cmd = "powershell.exe -NoProfile -Command \"Expand-Archive -Path '" +
        zipPath + "' -DestinationPath '" + destinationPath + "' -Force\"";

    int result = system(cmd.c_str());
    return (result == 0);
}

bool ZipUtils::CreateZip(const std::string& folderPath, const std::string& zipPath) {
    if (!FileUtils::FolderExists(folderPath)) {
        return false;
    }

    if (FileUtils::FileExists(zipPath)) {
        FileUtils::DeleteFile(zipPath);
    }

    // Append "\*" to folder path to zip the CONTENTS, not the folder itself.
    // Example: "C:\Models\ModelA\*" -> Zips files inside ModelA
    std::string sourcePath = folderPath;
    if (sourcePath.back() == '\\') {
        sourcePath.pop_back();
    }
    sourcePath += "\\*";

    // Standard Compress-Archive command
    std::string cmd = "powershell.exe -NoProfile -Command \"Compress-Archive -Path '" +
        sourcePath + "' -DestinationPath '" + zipPath + "' -Force\"";

    int result = system(cmd.c_str());

    // Check if file was created
    return (result == 0 && FileUtils::FileExists(zipPath));
}