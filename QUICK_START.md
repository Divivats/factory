# Quick Start Guide - Factory Monitoring System

## 🚀 Get Started in 5 Steps

### Step 1: Setup Database (5 minutes)

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to your SQL Server (localhost)
3. Open and execute these files **in order**:
   - `DatabaseSetup/01_CreateDatabase.sql`
   - `DatabaseSetup/02_CreateTables.sql`
   - `DatabaseSetup/03_CreateIndexes.sql`
   - `DatabaseSetup/04_CreateStoredProcedures.sql`
   - `DatabaseSetup/05_InsertTestData.sql` (optional)

**✅ Done!** Database is ready.

---

### Step 2: Run Web Application (2 minutes)

1. Open **Visual Studio 2022**
2. Open `FactoryMonitoringWeb/FactoryMonitoringWeb.csproj`
3. Press **F5** (or click the green Play button)
4. Browser opens automatically

**✅ Done!** Web server is running.

---

### Step 3: Download JSON Library for C++ Agent (1 minute)

1. Go to: https://raw.githubusercontent.com/nlohmann/json/develop/single_include/nlohmann/json.hpp
2. Right-click → Save As
3. Save to: `FactoryAgent/include/json.hpp`

**✅ Done!** Ready to build agent.

---

### Step 4: Build C++ Agent (2 minutes)

1. Open **new Visual Studio 2022** instance
2. Open `FactoryAgent/FactoryAgent.vcxproj`
3. Change to **Release | x64** at the top
4. Press **Ctrl+Shift+B** to build
5. Find executable at: `FactoryAgent/x64/Release/FactoryAgent.exe`

**✅ Done!** Agent is built.

---

### Step 5: Run Agent (1 minute)

1. Double-click `FactoryAgent.exe`
2. Fill in the registration form:
   - Line Number: `1`
   - PC Number: `1`
   - Config File Path: `C:\LAI\LAI-Operational\config.ini`
   - Log File Path: `C:\LAI\LAI-WorkData\Log`
   - Model Folder Path: `C:\LAI\LAI-Operational\Model`
   - Server URL: `http://localhost:5000`
3. Click **OK**

**✅ Done!** Agent is running in system tray.

---

## 🎉 Verify It's Working

1. Go back to your web browser
2. Refresh the page (F5)
3. You should see your PC in **Line 1**
4. Status should be **Online** (green)
5. Click on the PC to see details

---

## 📂 What You Have

```
Project Folder/
├── DatabaseSetup/          ← SQL scripts (run once)
├── FactoryMonitoringWeb/   ← Web application (keep running)
├── FactoryAgent/           ← C++ agent source code
│   └── x64/Release/        ← Built agent here
│       └── FactoryAgent.exe
├── SETUP_GUIDE.md          ← Detailed setup instructions
├── README.md               ← Full documentation
└── QUICK_START.md          ← This file
```

---

## 🔥 Common Issues

### "Cannot connect to database"
→ Make sure SQL Server is running
→ Check connection string in `appsettings.json`

### "Port 5000 already in use"
→ Close any other apps using port 5000
→ Or change port in `Properties/launchSettings.json`

### "Agent won't connect"
→ Make sure web server is running (Step 2)
→ Check server URL in agent registration
→ Try `http://localhost:5000` not `https://`

### "Models not showing"
→ Make sure model folder path is correct
→ Models should be folders, not files
→ Restart agent to re-sync

---

## 📖 Next Steps

1. **For detailed setup**: Read `SETUP_GUIDE.md`
2. **For full documentation**: Read `README.md`
3. **To deploy to more PCs**: Copy `FactoryAgent.exe` and run on each PC
4. **To host on IIS**: See "Hosting" section in `SETUP_GUIDE.md`

---

## 🎯 Key Features You Can Try

### In Web Portal:

✨ **Edit Config Files**
- Click on a PC → Edit config → Push Update

✨ **Switch Models**
- Select different model from dropdown → Apply Model

✨ **View Logs**
- Click "Refresh Log" to see latest log content

✨ **Bulk Upload**
- Go to "Show All" → Upload model to all PCs or specific line

✨ **Download Models**
- Select model → Click "Download Model" → Get ZIP file

---

## 💡 Tips

- Agent sends updates every **15 seconds**
- Config changes apply within **15 seconds**
- Keep web server running for agents to connect
- Use **Release** build for agent (not Debug)
- Agent runs in **system tray** (bottom-right)

---

## 🆘 Need Help?

1. Check `SETUP_GUIDE.md` Troubleshooting section
2. Look at `agent_log.txt` in agent folder
3. Check Visual Studio Output window
4. Check browser console (F12)

---

## 📊 Architecture at a Glance

```
Factory PC ←→ C++ Agent ←→ Web Server ←→ SQL Database ←→ Developer Browser
  (files)    (monitors)   (REST API)     (stores)       (web portal)
```

---

**You're all set! Start monitoring your factory PCs now. 🎊**

For detailed information, see:
- **SETUP_GUIDE.md** - Step-by-step with explanations
- **README.md** - Complete documentation
- **FactoryAgent/README.md** - Agent-specific details
