# Factory Agent - Lightweight C++ Monitoring Agent

## Overview
This is a lightweight Windows agent that runs in the background and monitors factory PC configurations, logs, and application status.

## Features
- Lightweight background operation
- 15-second heartbeat to server
- Config file monitoring and synchronization
- Log file upload
- Model folder management
- Application process monitoring
- Minimal CPU and memory usage

## Building the Project

### Prerequisites
- Visual Studio 2022 (or 2019 with C++17 support)
- Windows SDK 10.0 or later
- vcpkg for dependencies (optional - see below)

### Dependencies
This project uses:
- **WinHTTP** (included with Windows SDK) - for HTTP requests
- **nlohmann/json** (header-only) - for JSON parsing (included in project)

### Build Steps

1. Open Visual Studio 2022
2. File -> Open -> Project/Solution
3. Select `FactoryAgent.vcxproj`
4. Select **Release x64** configuration
5. Build -> Build Solution (Ctrl+Shift+B)
6. The executable will be in `x64\Release\FactoryAgent.exe`

## Configuration

### First Run
On first run, the agent will show a registration dialog where you need to enter:

1. **Line Number**: Your production line number (1, 2, 3, etc.)
2. **PC Number**: Your PC number on the line
3. **Config File Path**: Full path to your config file (e.g., `C:\LAI\LAI-Operational\config.ini`)
4. **Log File Path**: Full path to your log folder (e.g., `C:\LAI\LAI-WorkData\Log`)
5. **Model Folder Path**: Full path to your models folder (e.g., `C:\LAI\LAI-Operational\Model`)
6. **EXE Path** (Optional): Full path to the application executable to monitor
7. **Server URL**: The server API URL (e.g., `http://192.168.1.100:5000`)

### Agent Configuration File
After registration, settings are saved to `agent_config.json` in the same directory as the executable.

## Running the Agent

### Manual Start
Double-click `FactoryAgent.exe` to start the agent.

### Automatic Startup (Recommended)
1. Press `Win + R`
2. Type `shell:startup` and press Enter
3. Create a shortcut to `FactoryAgent.exe` in this folder
4. The agent will start automatically when Windows boots

## System Tray
The agent runs in the system tray with these features:
- Green icon: Connected and running
- Red icon: Disconnected
- Right-click menu:
  - Status
  - Reconnect
  - Exit

## Performance
- CPU Usage: < 0.1% (idle)
- Memory Usage: ~5-10 MB
- Network: Minimal (only during 15-second heartbeats and updates)

## Troubleshooting

### Agent won't connect
1. Check server URL in `agent_config.json`
2. Verify network connectivity
3. Check firewall settings
4. Verify server is running

### Config updates not applying
1. Check file permissions for config file
2. Verify path in `agent_config.json`
3. Check agent log file

### High CPU usage
1. Restart the agent
2. Check for large log files
3. Contact support if issue persists

## Logs
Agent logs are saved to `agent_log.txt` in the same directory.

## Uninstall
1. Close the agent (right-click system tray icon -> Exit)
2. Remove from startup folder if added
3. Delete the `FactoryAgent.exe` and `agent_config.json` files
