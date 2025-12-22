#include "../include/monitoring/ProcessMonitor.h"
#include <tlhelp32.h>
#include <algorithm>

ProcessMonitor::ProcessMonitor() {
}

ProcessMonitor::~ProcessMonitor() {
}

std::wstring ProcessMonitor::GetProcessNameFromPath(const std::wstring& exePath) {
    size_t pos = exePath.find_last_of(L"\\/");
    if (pos != std::wstring::npos) {
        return exePath.substr(pos + 1);
    }
    return exePath;
}

bool ProcessMonitor::IsProcessRunning(const std::wstring& exePath) {
    std::wstring processName = GetProcessNameFromPath(exePath);
    return IsProcessRunningByName(processName);
}

bool ProcessMonitor::IsProcessRunningByName(const std::wstring& processName) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        return false;
    }

    PROCESSENTRY32W pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32W);

    if (!Process32FirstW(hSnapshot, &pe32)) {
        CloseHandle(hSnapshot);
        return false;
    }

    std::wstring searchName = processName;
    std::transform(searchName.begin(), searchName.end(), searchName.begin(), ::towlower);

    bool found = false;
    do {
        std::wstring currentName = pe32.szExeFile;
        std::transform(currentName.begin(), currentName.end(), currentName.begin(), ::towlower);

        if (currentName == searchName) {
            found = true;
            break;
        }
    } while (Process32NextW(hSnapshot, &pe32));

    CloseHandle(hSnapshot);
    return found;
}