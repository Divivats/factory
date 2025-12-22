# 🏭 Factory Monitoring System - START HERE

## Welcome! 👋

You now have a **complete industrial monitoring system** for your lens assembly factory. This system allows developers to remotely monitor and control factory PCs from a web browser.

---

## 🚀 Choose Your Path

### I want to get started FAST (10 minutes)
👉 **Open: [`QUICK_START.md`](QUICK_START.md)**

This gives you the 5 essential steps to get everything running quickly.

---

### I want detailed step-by-step instructions
👉 **Open: [`SETUP_GUIDE.md`](SETUP_GUIDE.md)**

This is the complete guide with every step explained in detail, including troubleshooting.

---

### I want a checklist to follow
👉 **Print: [`SETUP_CHECKLIST.md`](SETUP_CHECKLIST.md)**

Print this and check off items as you complete them. Perfect for first-time setup.

---

### I want to understand what this system does
👉 **Read: [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md)**

Understand the architecture, features, and how everything works together.

---

### I want the complete technical documentation
👉 **Read: [`README.md`](README.md)**

Full documentation including API endpoints, database schema, and all technical details.

---

## 📦 What's Included

### 1. Database Scripts
**Folder**: `DatabaseSetup/`
- 5 SQL files to create your database
- Run these first in SQL Server Management Studio

### 2. Web Application (Developer Portal)
**Folder**: `FactoryMonitoringWeb/`
- ASP.NET Core web application
- Open `FactoryMonitoringWeb.csproj` in Visual Studio 2022
- This is what developers use to monitor factory PCs

### 3. C++ Agent (Runs on Factory PCs)
**Folder**: `FactoryAgent/`
- Lightweight background agent
- Open `FactoryAgent.vcxproj` in Visual Studio 2022
- Build and deploy to factory PCs

### 4. Documentation
- `QUICK_START.md` - Fast 10-minute setup
- `SETUP_GUIDE.md` - Detailed setup with explanations
- `SETUP_CHECKLIST.md` - Printable checklist
- `PROJECT_OVERVIEW.md` - System architecture and features
- `README.md` - Complete technical documentation

---

## ⚡ Quick Setup (Right Now!)

### Step 1: Database (5 min)
```
1. Open SQL Server Management Studio (SSMS)
2. Open files in DatabaseSetup/ folder
3. Execute 01, 02, 03, 04, 05 in order
✅ Database ready
```

### Step 2: Web App (2 min)
```
1. Open Visual Studio 2022
2. Open FactoryMonitoringWeb/FactoryMonitoringWeb.csproj
3. Press F5
✅ Web server running
```

### Step 3: Download JSON Library (1 min)
```
1. Go to: https://raw.githubusercontent.com/nlohmann/json/develop/single_include/nlohmann/json.hpp
2. Save to: FactoryAgent/include/json.hpp
✅ Ready to build agent
```

### Step 4: Build Agent (2 min)
```
1. Open new Visual Studio 2022
2. Open FactoryAgent/FactoryAgent.vcxproj
3. Change to Release | x64
4. Press Ctrl+Shift+B
✅ Agent built at: FactoryAgent/x64/Release/FactoryAgent.exe
```

### Step 5: Run Agent (1 min)
```
1. Double-click FactoryAgent.exe
2. Fill in registration form
3. Click OK
✅ Agent running in system tray
```

**That's it! Go to your browser and see your PC in the dashboard.**

---

## 🎯 What You Can Do Now

Once everything is running:

✅ **View All Factory PCs** - See every PC organized by production line
✅ **Monitor Online Status** - Green = online, Red = offline
✅ **Check Application Status** - See if lens assembly software is running
✅ **Edit Config Files** - Change configs from your desk
✅ **Push Updates** - Changes apply within 15 seconds
✅ **View Log Files** - See logs without remote desktop
✅ **Manage Models** - Upload, download, switch, delete
✅ **Bulk Operations** - Update all PCs at once

---

## 📁 File Structure

```
Your Project Folder/
│
├── START_HERE.md              ← You are here
├── QUICK_START.md             ← Fast setup guide
├── SETUP_GUIDE.md             ← Detailed setup
├── SETUP_CHECKLIST.md         ← Printable checklist
├── PROJECT_OVERVIEW.md        ← Architecture overview
├── README.md                  ← Full documentation
│
├── DatabaseSetup/
│   ├── 01_CreateDatabase.sql
│   ├── 02_CreateTables.sql
│   ├── 03_CreateIndexes.sql
│   ├── 04_CreateStoredProcedures.sql
│   └── 05_InsertTestData.sql
│
├── FactoryMonitoringWeb/      ← Web application
│   ├── Controllers/
│   ├── Models/
│   ├── Views/
│   ├── wwwroot/
│   └── FactoryMonitoringWeb.csproj  ← Open this
│
└── FactoryAgent/              ← C++ agent
    ├── include/
    ├── src/
    ├── IMPORTANT_SETUP_NOTE.txt
    └── FactoryAgent.vcxproj   ← Open this
```

---

## ⚠️ Important Notes

### Before You Start

1. **You need these installed**:
   - SQL Server 2019 or later
   - SQL Server Management Studio (SSMS)
   - Visual Studio 2022
   - .NET 8.0 SDK

2. **Download the JSON library** before building C++ agent:
   - See `FactoryAgent/IMPORTANT_SETUP_NOTE.txt`

3. **Keep the web server running** while testing agents

---

## 🆘 Need Help?

### Common Issues

**"Cannot connect to database"**
→ Check SQL Server is running
→ Verify connection string in `appsettings.json`

**"Agent won't connect"**
→ Make sure web server is running
→ Check server URL in agent config

**"Port 5000 already in use"**
→ Close other applications using that port

**"Models not showing"**
→ Verify model folder path exists
→ Models should be folders, not files

**For more help**: See Troubleshooting section in `SETUP_GUIDE.md`

---

## 🎓 Learning Resources

### New to SQL Server?
→ Start with `SETUP_GUIDE.md` - It guides you through SSMS step by step

### New to Visual Studio?
→ Just follow the steps in `QUICK_START.md` - No prior knowledge needed

### Want to modify the code?
→ Read `README.md` for architecture details
→ All code is commented and organized

---

## ✅ Success Checklist

After setup, you should have:

- [ ] Database created in SQL Server
- [ ] Web application running in browser
- [ ] At least one agent connected
- [ ] Can see PC in web portal
- [ ] PC shows as "Online"
- [ ] Can view PC details
- [ ] Can edit config file
- [ ] Can view logs

**If all checked, you're ready to go! 🎉**

---

## 🎯 Next Steps

### For Testing
1. Follow `QUICK_START.md`
2. Set up on your development machine
3. Test all features
4. Verify everything works

### For Production
1. Follow `SETUP_GUIDE.md`
2. Set up dedicated server
3. Deploy web app to IIS
4. Install agents on all factory PCs
5. Configure auto-start

---

## 📞 Support

All documentation is included:
- Setup guides explain every step
- Troubleshooting sections cover common issues
- Code is commented and organized
- Architecture is documented

**You have everything you need to deploy successfully.**

---

## 🎉 Ready to Begin?

### Recommended Path:

1. **Read this file** (you're doing it!) ✅
2. **Open `QUICK_START.md`** → Fast setup ⏭️
3. **Follow the 5 steps** → Get running
4. **Test the system** → Verify it works
5. **Read `SETUP_GUIDE.md`** → Understand details
6. **Deploy to production** → Go live!

---

## 💡 Pro Tips

- Use `SETUP_CHECKLIST.md` while setting up (print it!)
- Keep web server running during agent testing
- Test with one PC before deploying to all
- Use auto-start feature for production
- Backup your database regularly

---

## 🚀 START NOW

**Your next step**: Open [`QUICK_START.md`](QUICK_START.md)

It will have you up and running in **10 minutes**.

---

**Good luck with your factory monitoring system! 🏭📊**

Everything is ready. The setup is straightforward. You've got this! 💪

---

*Have a question? Check the docs. Everything is covered.*
*Hit an issue? See troubleshooting section.*
*Ready? Let's go!* → **[QUICK_START.md](QUICK_START.md)**
