# Factory Monitoring System - Complete Setup Guide

This guide will walk you through setting up the entire Factory Monitoring System from scratch. No prior experience with SQL Server or C#.NET is required.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Part 1: Database Setup](#part-1-database-setup)
3. [Part 2: Web Application Setup](#part-2-web-application-setup)
4. [Part 3: C++ Agent Setup](#part-3-c-agent-setup)
5. [Part 4: Testing the System](#part-4-testing-the-system)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure you have the following installed:

✅ **SQL Server 2025** (or SQL Server 2022/2019)
✅ **SQL Server Management Studio (SSMS)**
✅ **Visual Studio 2022** (with ASP.NET and C++ workloads)
✅ **.NET 8.0 SDK**

---

## Part 1: Database Setup

### Step 1.1: Open SQL Server Management Studio (SSMS)

1. Click the **Start Menu**
2. Type **"SSMS"** or **"SQL Server Management Studio"**
3. Click to open

### Step 1.2: Connect to SQL Server

1. In the **Connect to Server** dialog:
   - **Server type**: Database Engine
   - **Server name**: `localhost` (or `(local)` or `.`)
   - **Authentication**: Windows Authentication
   - Click **Connect**

### Step 1.3: Create the Database

1. In the project folder, navigate to `DatabaseSetup/`
2. You'll see 5 SQL files:
   - `01_CreateDatabase.sql`
   - `02_CreateTables.sql`
   - `03_CreateIndexes.sql`
   - `04_CreateStoredProcedures.sql`
   - `05_InsertTestData.sql` (optional)

3. **Run Each Script in Order:**

   **For Each File:**
   - In SSMS, click **File** → **Open** → **File**
   - Navigate to the SQL file (e.g., `01_CreateDatabase.sql`)
   - Click **Open**
   - Click the **Execute** button (or press F5)
   - Wait for the message: "Commands completed successfully"
   - Repeat for all 5 files **in order**

### Step 1.4: Verify Database Creation

1. In SSMS, in the **Object Explorer** (left panel):
2. Expand **Databases**
3. You should see **FactoryMonitoringDB**
4. Expand it → expand **Tables**
5. You should see 8 tables:
   - AgentCommands
   - ConfigFiles
   - FactoryPCs
   - LogFiles
   - ModelDistribution
   - ModelFiles
   - Models
   - SystemLogs

**✅ Database Setup Complete!**

---

## Part 2: Web Application Setup

### Step 2.1: Open the Web Project in Visual Studio

1. Open **Visual Studio 2022**
2. Click **File** → **Open** → **Project/Solution**
3. Navigate to `FactoryMonitoringWeb/`
4. Select **FactoryMonitoringWeb.csproj**
5. Click **Open**

### Step 2.2: Configure Database Connection

1. In Visual Studio, in the **Solution Explorer** (right panel):
2. Double-click **appsettings.json**
3. Find the connection string:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=FactoryMonitoringDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

4. **If your SQL Server is on a different machine**, change `localhost` to the server's IP address or name
5. **Save the file** (Ctrl+S)

### Step 2.3: Restore NuGet Packages

1. In Visual Studio, click **Tools** → **NuGet Package Manager** → **Manage NuGet Packages for Solution**
2. If you see a **Restore** button at the top, click it
3. Wait for all packages to download and install
4. Close the NuGet window

### Step 2.4: Build the Project

1. Click **Build** → **Build Solution** (or press Ctrl+Shift+B)
2. Wait for the build to complete
3. Check the **Output** window at the bottom
4. You should see: **"Build succeeded"**

### Step 2.5: Run the Web Application

1. At the top of Visual Studio, you'll see a green **▶ Play** button
2. Next to it, select **"https"** or **"FactoryMonitoringWeb"** from the dropdown
3. Click the **▶ Play** button (or press F5)
4. A browser window will open automatically
5. You should see the **Factory Monitoring Dashboard**

**Note:** The first run might take a minute as Visual Studio sets up the development certificate.

### Step 2.6: Accept the Development Certificate (First Time Only)

If you see a security warning:
1. Click **"Advanced"**
2. Click **"Proceed to localhost"** or **"Accept"**
3. In the Windows dialog, click **"Yes"** to trust the certificate

### Step 2.7: Verify the Web Portal

You should now see:
- A dark header with "Factory Monitoring System"
- Navigation links: Dashboard | Show All
- If you ran the test data script, you'll see Line 1, Line 2, and Line 3 with PCs
- PCs will show as **Offline** (red) initially

**✅ Web Application Setup Complete!**

**Keep this running!** The web server needs to be running for the agents to connect.

---

## Part 3: C++ Agent Setup

### Step 3.1: Download nlohmann JSON Header

Before building the C++ agent, you need to download the JSON library:

1. Open your web browser
2. Go to: https://github.com/nlohmann/json/releases
3. Download **json.hpp** from the latest release
4. Save it to: `FactoryAgent/include/json.hpp`

### Step 3.2: Open the C++ Agent Project

1. Open a **new instance** of **Visual Studio 2022** (keep the web app running in the other instance)
2. Click **File** → **Open** → **Project/Solution**
3. Navigate to `FactoryAgent/`
4. Select **FactoryAgent.vcxproj**
5. Click **Open**

### Step 3.3: Configure Build Settings

1. At the top of Visual Studio, change the configuration:
   - Change **Debug** to **Release**
   - Change **x86** to **x64**
   - Should show: **Release | x64**

### Step 3.4: Build the Agent

1. Click **Build** → **Build Solution** (or press Ctrl+Shift+B)
2. Wait for the build to complete
3. Check the **Output** window
4. You should see: **"Build succeeded"**

### Step 3.5: Locate the Agent Executable

The built agent is located at:
```
FactoryAgent/x64/Release/FactoryAgent.exe
```

### Step 3.6: Run the Agent (First Time Setup)

1. Navigate to: `FactoryAgent/x64/Release/`
2. Double-click **FactoryAgent.exe**
3. A **Registration Dialog** will appear

### Step 3.7: Configure the Agent

Fill in the registration form:

1. **Line Number**: Enter `1` (for Line 1)
2. **PC Number**: Enter `1` (for PC 1)
3. **Config File Path**: Enter the full path to your config file
   - Example: `C:\LAI\LAI-Operational\config.ini`
   - Make sure this file exists!
4. **Log File Path**: Enter the path to your log folder
   - Example: `C:\LAI\LAI-WorkData\Log`
5. **Model Folder Path**: Enter the path to your models folder
   - Example: `C:\LAI\LAI-Operational\Model`
6. **EXE Path** (Optional): Full path to the application you want to monitor
   - Example: `C:\YourApp\Application.exe`
   - Leave blank if you don't want to monitor a specific application
7. **Server URL**: Enter your web server URL
   - For local testing: `http://localhost:5000`
   - For network server: `http://192.168.1.100:5000` (replace with actual IP)
8. Click **OK**

### Step 3.8: Verify Agent is Running

1. Look at the **System Tray** (bottom-right of your screen, near the clock)
2. You should see a new icon for the Factory Agent
3. The icon should be **green** (connected) or **blue** (trying to connect)

### Step 3.9: Check Agent Status

1. Right-click the **Factory Agent** icon in the system tray
2. Click **Status**
3. You should see:
   - Running: Yes
   - Line: 1
   - PC: 1
   - PC ID: (a number assigned by the server)

**✅ C++ Agent Setup Complete!**

---

## Part 4: Testing the System

### Test 4.1: Verify PC Appears in Web Portal

1. Go back to your web browser with the Factory Monitoring Dashboard
2. Refresh the page (F5)
3. You should now see your PC appear in **Line 1**
4. The PC should show as **Online** (green)
5. Click on the PC card

### Test 4.2: Verify PC Details Page

You should see:
- PC information (name, IP, status)
- File paths (config, log, model folder)
- Models dropdown (if models exist in your model folder)
- Config file content (if config file exists)

### Test 4.3: Test Config File Edit

1. In the **Configuration File** section, make a small change to the text
2. Click **Push Update**
3. Wait a few seconds
4. Check your actual config file on disk
5. It should update within 15 seconds

### Test 4.4: Test Model Switching

1. If you have multiple models in your model folder:
2. Select a different model from the dropdown
3. Click **Apply Model**
4. Wait a few seconds
5. Check your config file - the `[current_model]` section should update

### Test 4.5: Test "Show All" Page

1. Click **Show All** in the navigation
2. You should see a table with all PCs
3. You can bulk upload models to all PCs or specific lines

**✅ System is Working!**

---

## Deploying to Multiple Factory PCs

### For Each Additional Factory PC:

1. **Copy** the `FactoryAgent.exe` from `FactoryAgent/x64/Release/` to the factory PC
2. **Run** the agent
3. In the registration dialog:
   - **Line Number**: Enter the correct line (1, 2, 3, 4, etc.)
   - **PC Number**: Enter the PC number on that line
   - **Config File Path**: Enter the path specific to that PC
   - **Log File Path**: Enter the path specific to that PC
   - **Model Folder Path**: Enter the path specific to that PC
   - **Server URL**: Enter your **server's IP address** (e.g., `http://192.168.1.100:5000`)
4. Click **OK**

The PC will automatically appear in the web portal!

---

## Setting Up Agent Auto-Start

To make the agent start automatically when Windows boots:

1. Press **Win + R**
2. Type: `shell:startup`
3. Press **Enter**
4. Copy **FactoryAgent.exe** to this folder (or create a shortcut)
5. The agent will now start automatically on boot

---

## Hosting the Web Application on IIS

For production deployment:

### Step 1: Publish the Web Application

1. In Visual Studio, right-click the **FactoryMonitoringWeb** project
2. Click **Publish**
3. Choose **Folder** as the target
4. Select a folder (e.g., `C:\inetpub\FactoryMonitoring`)
5. Click **Publish**

### Step 2: Configure IIS

1. Open **Internet Information Services (IIS) Manager**
2. Right-click **Sites** → **Add Website**
3. Fill in:
   - **Site name**: FactoryMonitoring
   - **Physical path**: `C:\inetpub\FactoryMonitoring`
   - **Port**: `5000` (or any port you prefer)
4. Click **OK**

### Step 3: Update Agent Configuration

On each factory PC:
1. Stop the agent (right-click tray icon → Exit)
2. Edit `agent_config.json`
3. Change `serverUrl` to your server's IP and port
4. Example: `"serverUrl": "http://192.168.1.100:5000"`
5. Save and restart the agent

---

## Troubleshooting

### Database Connection Failed

**Error:** "Cannot connect to database"

**Solution:**
1. Open SSMS
2. Verify you can connect to SQL Server
3. Check that `FactoryMonitoringDB` exists
4. In `appsettings.json`, verify the connection string
5. Try changing `localhost` to `(local)` or `.`

### Web Application Won't Start

**Error:** "Port already in use"

**Solution:**
1. Close any other applications using port 5000
2. Or change the port in `Properties/launchSettings.json`

### Agent Won't Connect

**Error:** Agent shows red icon

**Solution:**
1. Verify the web server is running
2. Check the server URL in `agent_config.json`
3. Make sure the firewall allows connections on port 5000
4. Try accessing `http://localhost:5000` in a browser on the same PC

### Config File Not Updating

**Problem:** Changes from web portal don't apply

**Solution:**
1. Verify the config file path in agent settings
2. Check file permissions - agent needs write access
3. Check `agent_log.txt` for errors
4. Restart the agent

### Models Not Showing

**Problem:** No models in dropdown

**Solution:**
1. Verify the model folder path is correct
2. Check that model folders exist in that path
3. Make sure each model is a folder (not a file)
4. Restart the agent to re-sync

### High CPU Usage

**Problem:** Agent using too much CPU

**Solution:**
1. Check for very large log files
2. Restart the agent
3. Check `agent_log.txt` for repeated errors

---

## System Architecture

```
Factory PCs (with Agents)
         ↓
    TCP/HTTP
         ↓
   Web Server (ASP.NET Core)
         ↓
   SQL Server Database
         ↓
    Web Portal (Browser)
```

Each agent:
- Runs in background
- Sends heartbeat every 15 seconds
- Monitors config file changes
- Monitors log files
- Monitors application status
- Executes commands from server

---

## Need Help?

If you encounter issues:

1. Check **agent_log.txt** in the agent folder
2. Check **SQL Server logs** in SSMS
3. Check **Visual Studio Output** window
4. Check **Browser Developer Console** (F12)

---

## Summary

You now have a complete factory monitoring system with:

✅ SQL Server database storing all PC data
✅ ASP.NET Core web portal for viewing and controlling PCs
✅ Lightweight C++ agents running on factory PCs
✅ Real-time monitoring of config files, logs, and application status
✅ Remote config file editing and model management
✅ Bulk operations across multiple PCs

**Congratulations!** Your factory monitoring system is ready to use.
