#ifndef TRAY_ICON_H
#define TRAY_ICON_H

#include <windows.h>
#include <shellapi.h>

#define WM_TRAYICON (WM_USER + 1)
#define ID_TRAY_EXIT 1001
#define ID_TRAY_STATUS 1002
#define ID_TRAY_RECONNECT 1003

class TrayIcon {
public:
    TrayIcon();
    ~TrayIcon();

    bool Create(HWND hwnd, bool connected);
    void Update(bool connected);
    void Remove();

private:
    NOTIFYICONDATA nid_;
    bool created_;

    TrayIcon(const TrayIcon&);
};

#endif