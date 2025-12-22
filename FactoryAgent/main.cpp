#include <windows.h>
#include <shellapi.h>
#include <fstream>
#include "../include/core/AgentCore.h"
#include "../include/ui/TrayIcon.h"
#include "../include/ui/RegistrationDialog.h"
#include "../include/common/Constants.h"
#include "../include/common/Types.h"
#include "../third_party/json/json.hpp"

using json = nlohmann::json;

/*
 * main.cpp
 * Application entry point
 * Sets up window, tray icon, and starts agent
 */

AgentCore* g_agentCore = NULL;
TrayIcon* g_trayIcon = NULL;
HWND g_hwnd = NULL;
HMENU g_popupMenu = NULL;
bool g_exitRequested = false;

bool LoadSettings(AgentSettings& settings);
void SaveSettings(const AgentSettings& settings);
LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);

bool LoadSettings(AgentSettings& settings) {
    std::ifstream file(AgentConstants::CONFIG_FILE_NAME);
    if (!file.is_open()) {
        return false;
    }

    try {
        json config;
        file >> config;

        settings.pcId = config.value("pcId", 0);
        settings.lineNumber = config["lineNumber"];
        settings.pcNumber = config["pcNumber"];
        settings.configFilePath = config["configFilePath"];
        settings.logFilePath = config["logFilePath"];
        settings.modelFolderPath = config["modelFolderPath"];
        // Backward compatible: default to 3.5 if not present
        settings.modelVersion = config.value("modelVersion", std::string("3.5"));

        std::string serverUrlStr = config["serverUrl"];
        settings.serverUrl = std::wstring(serverUrlStr.begin(), serverUrlStr.end());

        return true;
    }
    catch (...) {
        return false;
    }
}

void SaveSettings(const AgentSettings& settings) {
    json config;
    config["pcId"] = settings.pcId;
    config["lineNumber"] = settings.lineNumber;
    config["pcNumber"] = settings.pcNumber;
    config["configFilePath"] = settings.configFilePath;
    config["logFilePath"] = settings.logFilePath;
    config["modelFolderPath"] = settings.modelFolderPath;
    config["modelVersion"] = settings.modelVersion;

    std::string serverUrlStr(settings.serverUrl.begin(), settings.serverUrl.end());
    config["serverUrl"] = serverUrlStr;

    std::ofstream file(AgentConstants::CONFIG_FILE_NAME);
    file << config.dump(4);
}

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
    case WM_TRAYICON:
        if (lParam == WM_RBUTTONUP) {
            POINT pt;
            GetCursorPos(&pt);
            SetForegroundWindow(hwnd);
            TrackPopupMenu(g_popupMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN,
                pt.x, pt.y, 0, hwnd, NULL);
        }
        return 0;

    case WM_COMMAND:
        switch (LOWORD(wParam)) {
        case ID_TRAY_EXIT:
            g_exitRequested = true;
            if (g_agentCore) {
                g_agentCore->Stop();
            }
            PostQuitMessage(0);
            break;

        case ID_TRAY_STATUS:
            MessageBox(hwnd, L"Agent is running", L"Status", MB_OK | MB_ICONINFORMATION);
            break;

        case ID_TRAY_RECONNECT:
            MessageBox(hwnd, L"Reconnecting...", L"Factory Agent", MB_OK | MB_ICONINFORMATION);
            break;
        }
        return 0;

    case WM_DESTROY:
        if (g_trayIcon) {
            g_trayIcon->Remove();
        }
        PostQuitMessage(0);
        return 0;

    default:
        return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    WNDCLASSEX wc;
    ZeroMemory(&wc, sizeof(WNDCLASSEX));
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = AgentConstants::WINDOW_CLASS_NAME;

    if (!RegisterClassEx(&wc)) {
        return 1;
    }

    g_hwnd = CreateWindowEx(0, AgentConstants::WINDOW_CLASS_NAME,
        AgentConstants::WINDOW_TITLE, 0,
        0, 0, 1, 1, NULL, NULL, hInstance, NULL);

    if (!g_hwnd) {
        return 1;
    }

    g_popupMenu = CreatePopupMenu();
    AppendMenu(g_popupMenu, MF_STRING, ID_TRAY_STATUS, L"Status");
    AppendMenu(g_popupMenu, MF_STRING, ID_TRAY_RECONNECT, L"Reconnect");
    AppendMenu(g_popupMenu, MF_SEPARATOR, 0, NULL);
    AppendMenu(g_popupMenu, MF_STRING, ID_TRAY_EXIT, L"Exit");

    AgentSettings settings;
    if (!LoadSettings(settings)) {
        if (!RegistrationDialog::ShowDialog(hInstance, settings)) {
            DestroyWindow(g_hwnd);
            return 0;
        }
        SaveSettings(settings);
    }

    g_agentCore = new AgentCore();
    if (!g_agentCore->Initialize(settings)) {
        delete g_agentCore;
        DestroyWindow(g_hwnd);
        return 1;
    }

    g_trayIcon = new TrayIcon();
    g_trayIcon->Create(g_hwnd, true);

    g_agentCore->Start();

    MSG msg;
    ZeroMemory(&msg, sizeof(MSG));

    while (!g_exitRequested) {
        if (GetMessage(&msg, NULL, 0, 0) > 0) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
        else {
            break;
        }
    }

    if (g_agentCore) {
        g_agentCore->Stop();
        delete g_agentCore;
    }

    if (g_trayIcon) {
        g_trayIcon->Remove();
        delete g_trayIcon;
    }

    DestroyWindow(g_hwnd);

    return 0;
}