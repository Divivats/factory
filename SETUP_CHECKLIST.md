# Factory Monitoring System - Setup Checklist

Print this page and check off items as you complete them.

## Prerequisites Check

- [ ] Windows 10/11 or Windows Server installed
- [ ] SQL Server 2019 or later installed
- [ ] SQL Server Management Studio (SSMS) installed
- [ ] Visual Studio 2022 installed
- [ ] .NET 8.0 SDK installed
- [ ] C++ workload installed in Visual Studio
- [ ] ASP.NET workload installed in Visual Studio

---

## Phase 1: Database Setup

- [ ] Open SQL Server Management Studio (SSMS)
- [ ] Connect to SQL Server successfully
- [ ] Navigate to `DatabaseSetup/` folder
- [ ] Execute `01_CreateDatabase.sql` - Database created
- [ ] Execute `02_CreateTables.sql` - Tables created
- [ ] Execute `03_CreateIndexes.sql` - Indexes created
- [ ] Execute `04_CreateStoredProcedures.sql` - Stored procedures created
- [ ] Execute `05_InsertTestData.sql` (optional) - Test data inserted
- [ ] Verify: See "FactoryMonitoringDB" in SSMS Object Explorer
- [ ] Verify: Expand database and see 8 tables

**✅ Database Phase Complete**

---

## Phase 2: Web Application Setup

- [ ] Open Visual Studio 2022
- [ ] Open `FactoryMonitoringWeb/FactoryMonitoringWeb.csproj`
- [ ] Project loads without errors
- [ ] Open `appsettings.json`
- [ ] Verify/update connection string (change localhost if needed)
- [ ] Save `appsettings.json`
- [ ] Right-click solution → Restore NuGet Packages
- [ ] Wait for packages to restore
- [ ] Build solution (Ctrl+Shift+B)
- [ ] Build succeeds with no errors
- [ ] Press F5 to run application
- [ ] Accept development certificate if prompted
- [ ] Browser opens automatically
- [ ] See "Factory Monitoring System" header
- [ ] See dashboard page (may be empty initially)

**✅ Web Application Phase Complete**

**⚠️ Keep this running! Don't close Visual Studio or browser.**

---

## Phase 3: C++ Agent Preparation

- [ ] Open web browser
- [ ] Go to: https://github.com/nlohmann/json/releases
- [ ] Download `json.hpp` file
- [ ] Place file in `FactoryAgent/include/json.hpp`
- [ ] Verify file exists at correct location

**✅ JSON Library Downloaded**

---

## Phase 4: C++ Agent Build

- [ ] Open **new** Visual Studio 2022 instance (keep web app running)
- [ ] Open `FactoryAgent/FactoryAgent.vcxproj`
- [ ] Project loads without errors
- [ ] Change configuration to **Release**
- [ ] Change platform to **x64**
- [ ] Verify: Top toolbar shows "Release | x64"
- [ ] Build solution (Ctrl+Shift+B)
- [ ] Build succeeds with no errors
- [ ] Navigate to `FactoryAgent/x64/Release/`
- [ ] Verify `FactoryAgent.exe` exists

**✅ Agent Build Phase Complete**

---

## Phase 5: Agent Configuration

- [ ] Have your paths ready:
  - [ ] Config file path (e.g., C:\LAI\LAI-Operational\config.ini)
  - [ ] Log folder path (e.g., C:\LAI\LAI-WorkData\Log)
  - [ ] Model folder path (e.g., C:\LAI\LAI-Operational\Model)
  - [ ] Application EXE path (optional)
- [ ] Verify these files/folders exist on your PC
- [ ] Note your line number (1, 2, 3, 4, etc.)
- [ ] Note your PC number on that line
- [ ] Know your server URL (http://localhost:5000 for local testing)

**✅ Paths Verified**

---

## Phase 6: First Agent Run

- [ ] Navigate to `FactoryAgent/x64/Release/`
- [ ] Double-click `FactoryAgent.exe`
- [ ] Registration dialog appears
- [ ] Enter Line Number
- [ ] Enter PC Number
- [ ] Enter Config File Path
- [ ] Enter Log Folder Path
- [ ] Enter Model Folder Path
- [ ] Enter EXE Path (or leave blank)
- [ ] Enter Server URL
- [ ] Click OK
- [ ] Dialog closes
- [ ] Check system tray (bottom-right of screen)
- [ ] See Factory Agent icon (should be green or blue)
- [ ] Right-click icon → Status
- [ ] See status information with PC ID

**✅ Agent Running**

---

## Phase 7: Verification

### Web Portal Check
- [ ] Go back to web browser with Factory Monitoring Dashboard
- [ ] Refresh page (F5)
- [ ] See your PC appear in the correct line
- [ ] PC shows as "Online" (green)
- [ ] Click on your PC card
- [ ] See PC Details page
- [ ] See PC information filled in
- [ ] See config file content (if file exists)
- [ ] See models dropdown (if models exist)

### Agent Check
- [ ] Right-click agent icon in system tray
- [ ] Click "Status"
- [ ] Verify information is correct
- [ ] Close status dialog

### Config Update Test
- [ ] In web portal, on PC Details page
- [ ] Scroll to Configuration File section
- [ ] Make a small edit (add a comment or space)
- [ ] Click "Push Update"
- [ ] Wait 15 seconds
- [ ] Open your actual config file on disk
- [ ] Verify change was applied

**✅ System Verified Working!**

---

## Phase 8: Additional PCs (Optional)

For each additional factory PC:

### PC #_____ - Line #_____
- [ ] Copy `FactoryAgent.exe` to this PC
- [ ] Run the agent
- [ ] Fill in registration:
  - [ ] Line number: _____
  - [ ] PC number: _____
  - [ ] Config path: _____________________
  - [ ] Log path: _____________________
  - [ ] Model path: _____________________
  - [ ] Server URL: _____________________ (use server IP)
- [ ] Click OK
- [ ] Agent appears in system tray
- [ ] PC appears in web portal
- [ ] PC shows online

**✅ PC #_____ Configured**

---

## Phase 9: Auto-Start Setup (Recommended)

For each PC where agent is running:

- [ ] Press Win + R
- [ ] Type: `shell:startup`
- [ ] Press Enter
- [ ] Startup folder opens
- [ ] Copy `FactoryAgent.exe` to this folder (or create shortcut)
- [ ] Restart PC to test
- [ ] After restart, agent starts automatically
- [ ] PC appears in web portal

**✅ Auto-Start Configured**

---

## Phase 10: IIS Deployment (Production)

For production deployment:

- [ ] In Visual Studio (web app), right-click project
- [ ] Click Publish
- [ ] Choose Folder as target
- [ ] Set path: C:\inetpub\FactoryMonitoring
- [ ] Click Publish
- [ ] Wait for publish to complete
- [ ] Open IIS Manager
- [ ] Right-click Sites → Add Website
- [ ] Site name: FactoryMonitoring
- [ ] Physical path: C:\inetpub\FactoryMonitoring
- [ ] Port: 5000 (or your preferred port)
- [ ] Click OK
- [ ] Start the website
- [ ] Test by browsing to: http://localhost:5000
- [ ] Update all agents' `agent_config.json`:
  - [ ] Change serverUrl to server's IP address
  - [ ] Example: "serverUrl": "http://192.168.1.100:5000"
- [ ] Restart all agents
- [ ] Verify all PCs appear in web portal

**✅ Production Deployment Complete**

---

## Troubleshooting Checklist

If something isn't working:

### Database Issues
- [ ] SQL Server service is running
- [ ] Can connect to SQL Server in SSMS
- [ ] Database "FactoryMonitoringDB" exists
- [ ] Database has all 8 tables
- [ ] Connection string in appsettings.json is correct

### Web Application Issues
- [ ] Visual Studio shows no errors in Output window
- [ ] NuGet packages restored successfully
- [ ] Build succeeded with 0 errors
- [ ] Port 5000 is not used by another application
- [ ] Firewall allows connections on port 5000

### Agent Issues
- [ ] json.hpp file exists in include folder
- [ ] Agent built in Release x64 configuration
- [ ] All paths in registration are correct
- [ ] Files/folders in paths actually exist
- [ ] Server URL is correct and reachable
- [ ] Web server is running
- [ ] Firewall allows agent to connect

### Connection Issues
- [ ] Web server is running
- [ ] SQL Server is running
- [ ] Server URL in agent config is correct
- [ ] Network connectivity between PC and server
- [ ] No firewall blocking connections
- [ ] Port 5000 is open and accessible

---

## Quick Reference

### Important Files
- **Database Scripts**: `DatabaseSetup/*.sql`
- **Web App Config**: `FactoryMonitoringWeb/appsettings.json`
- **Agent Executable**: `FactoryAgent/x64/Release/FactoryAgent.exe`
- **Agent Config**: `agent_config.json` (same folder as exe)

### Important Paths
- **Web App**: `FactoryMonitoringWeb/FactoryMonitoringWeb.csproj`
- **Agent**: `FactoryAgent/FactoryAgent.vcxproj`
- **Setup Guide**: `SETUP_GUIDE.md`
- **Documentation**: `README.md`

### Default Settings
- **Database**: FactoryMonitoringDB
- **Server**: localhost
- **Port**: 5000
- **Heartbeat**: Every 15 seconds

---

## Final Checklist

- [ ] Database is set up and accessible
- [ ] Web application runs and is accessible
- [ ] At least one agent is running and connected
- [ ] Can see PC in web portal
- [ ] Can view PC details
- [ ] Can edit and push config updates
- [ ] Can view log files
- [ ] Can manage models
- [ ] System is ready for production use

**🎉 Setup Complete! System is operational.**

---

**Date Completed**: ___________________

**Completed By**: ___________________

**Notes**:
___________________________________________
___________________________________________
___________________________________________
___________________________________________

---

For help, see:
- **QUICK_START.md** - Fast setup guide
- **SETUP_GUIDE.md** - Detailed step-by-step
- **README.md** - Full documentation
