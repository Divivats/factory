#ifndef PROCESS_MONITOR_H
#define PROCESS_MONITOR_H

/*
 * ProcessMonitor.h
 * Monitors running processes
 */

#include <string>
#include <windows.h>

class ProcessMonitor {
public:
    ProcessMonitor();
    ~ProcessMonitor();

    bool IsProcessRunning(const std::wstring& exePath);
    bool IsProcessRunningByName(const std::wstring& processName);

private:
    std::wstring GetProcessNameFromPath(const std::wstring& exePath);
};

#endif