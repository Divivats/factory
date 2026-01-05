#include "../include/ui/RegistrationDialog.h"
#include "../include/common/Constants.h"

AgentSettings* RegistrationDialog::settings_ = NULL;

bool RegistrationDialog::ShowDialog(HINSTANCE hInstance, AgentSettings& settings) {
    settings_ = &settings;

    settings.lineNumber = 1;
    settings.pcNumber = 1;
    settings.modelVersion = "3.5";
    settings.serverUrl = L"http://localhost:5000";
    settings.exeName = L"msedge.exe";

    INT_PTR result = DialogBoxParam(hInstance, MAKEINTRESOURCE(IDD_REGISTRATION),
        NULL, DialogProc, (LPARAM)&settings);
    return (result == IDOK);
}

INT_PTR CALLBACK RegistrationDialog::DialogProc(HWND hDlg, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_INITDIALOG:
    {
        SetDlgItemInt(hDlg, IDC_LINE_NUMBER, 1, FALSE);
        SetDlgItemInt(hDlg, IDC_PC_NUMBER, 1, FALSE);
        SetDlgItemTextA(hDlg, IDC_CONFIG_PATH, "C:\\LAI\\LAI-Operational\\config.ini");
        SetDlgItemTextA(hDlg, IDC_LOG_PATH, "C:\\LAI\\LAI-WorkData\\Log");
        SetDlgItemTextA(hDlg, IDC_MODEL_PATH, "C:\\LAI\\LAI-Operational\\Model");
        SetDlgItemTextW(hDlg, IDC_SERVER_URL, L"http://localhost:5000");
        SetDlgItemTextW(hDlg, IDC_EXE_NAME, L"msedge.exe");

        // Populate model version dropdown
        HWND hVersionCombo = GetDlgItem(hDlg, IDC_MODEL_VERSION);
        if (hVersionCombo) {
            SendMessageA(hVersionCombo, CB_ADDSTRING, 0, (LPARAM)"3.5");
            SendMessageA(hVersionCombo, CB_ADDSTRING, 0, (LPARAM)"4.0");
            // Select default version 3.5
            SendMessageA(hVersionCombo, CB_SETCURSEL, 0, 0);
        }
        return TRUE;
    }

    case WM_COMMAND:
        if (LOWORD(wParam) == IDOK) {
            if (settings_) {
                settings_->lineNumber = GetDlgItemInt(hDlg, IDC_LINE_NUMBER, NULL, FALSE);
                settings_->pcNumber = GetDlgItemInt(hDlg, IDC_PC_NUMBER, NULL, FALSE);

                char configPath[AgentConstants::MAX_PATH_LENGTH];
                char logPath[AgentConstants::MAX_PATH_LENGTH];
                char modelPath[AgentConstants::MAX_PATH_LENGTH];
                char modelVersion[32];
                wchar_t serverUrl[AgentConstants::MAX_PATH_LENGTH];
                wchar_t exeName[AgentConstants::MAX_PATH_LENGTH];

                GetDlgItemTextA(hDlg, IDC_CONFIG_PATH, configPath, AgentConstants::MAX_PATH_LENGTH);
                GetDlgItemTextA(hDlg, IDC_LOG_PATH, logPath, AgentConstants::MAX_PATH_LENGTH);
                GetDlgItemTextA(hDlg, IDC_MODEL_PATH, modelPath, AgentConstants::MAX_PATH_LENGTH);

                // Read selected model version from combo box
                HWND hVersionCombo = GetDlgItem(hDlg, IDC_MODEL_VERSION);
                modelVersion[0] = '\0';
                if (hVersionCombo) {
                    int sel = (int)SendMessage(hVersionCombo, CB_GETCURSEL, 0, 0);
                    if (sel != CB_ERR) {
                        SendMessageA(hVersionCombo, CB_GETLBTEXT, sel, (LPARAM)modelVersion);
                    }
                }

                GetDlgItemTextW(hDlg, IDC_SERVER_URL, serverUrl, AgentConstants::MAX_PATH_LENGTH);
                GetDlgItemTextW(hDlg, IDC_EXE_NAME, exeName, AgentConstants::MAX_PATH_LENGTH);

                settings_->configFilePath = configPath;
                settings_->logFolderPath = logPath;
                settings_->modelFolderPath = modelPath;
                if (modelVersion[0] != '\0') {
                    settings_->modelVersion = modelVersion;
                }
                settings_->serverUrl = serverUrl;
                settings_->exeName = exeName;
            }

            EndDialog(hDlg, IDOK);
            return TRUE;
        }
        else if (LOWORD(wParam) == IDCANCEL) {
            EndDialog(hDlg, IDCANCEL);
            return TRUE;
        }
        break;
    }

    return FALSE;
}