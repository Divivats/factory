# Complete Factory Monitoring System - Setup Guide

## 🎉 What's Been Completed

This is a **complete, professional factory monitoring system** with:

1. ✅ **Modern React Frontend** - Professional dark industrial theme
2. ✅ **ASP.NET Core API Backend** - RESTful API with EF Core
3. ✅ **C++ Agent** - Windows service with version selection & auto IP
4. ✅ **SQL Server Database** - Complete schema with model library support
5. ✅ **Model Management System** - Upload, store, and deploy models

---

## 📁 Project Structure

```
project/
├── factory-react-ui/              # 🆕 React Frontend (NEW!)
│   ├── src/
│   │   ├── components/            # UI Components
│   │   ├── pages/                 # Pages (Dashboard, PC Details, Library)
│   │   ├── services/              # API integration
│   │   └── types/                 # TypeScript definitions
│   ├── package.json
│   └── README.md
│
├── FactoryMonitoringWeb/          # ASP.NET Core Backend
│   ├── Controllers/
│   │   ├── ApiController.cs       # 🆕 React API endpoints
│   │   ├── ModelLibraryController.cs  # 🆕 Model library API
│   │   ├── AgentApiController.cs  # Agent communication
│   │   ├── ModelController.cs
│   │   └── PCController.cs
│   ├── Models/
│   │   ├── ModelFile.cs           # ✅ Updated with IsTemplate
│   │   └── ...
│   └── Program.cs
│
├── FactoryAgent/                   # C++ Windows Agent
│   ├── src/
│   │   ├── ui/
│   │   │   └── RegistrationDialog.cpp  # ✅ Version dropdown added
│   │   └── services/
│   │       └── RegistrationService.cpp  # ✅ Auto IP fetching
│   └── resource.rc                # ✅ Updated dialog
│
└── db/                            # Database Scripts
    ├── 01_CreateDatabase.sql
    ├── 02_CreateTables.sql        # ✅ All 8 tables
    ├── 03_CreateIndexes.sql       # ✅ All indexes
    ├── 04_CreateStoredProcedures.sql
    ├── 05_InsertTestData.sql
    └── 07_AddModelLibrary.sql     # 🆕 Model library enhancement
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Database Setup

```sql
-- Run these files in order in SQL Server Management Studio:
1. db/01_CreateDatabase.sql
2. db/02_CreateTables.sql
3. db/03_CreateIndexes.sql
4. db/04_CreateStoredProcedures.sql
5. db/07_AddModelLibrary.sql (NEW - for model library)
6. db/05_InsertTestData.sql (optional - test data)
```

### Step 2: Backend Setup

```bash
cd FactoryMonitoringWeb

# Update appsettings.json with your SQL Server connection string
# Then run:
dotnet restore
dotnet run
```

Backend will start on `http://localhost:5000`

### Step 3: Frontend Setup

```bash
cd factory-react-ui

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will start on `http://localhost:3000`

**Open browser to http://localhost:3000** 🎉

---

## 🎨 Modern UI Features

### Dashboard
- **Left Sidebar**: Version navigation (3.5, 4.0, etc.)
- **Main Area**: PCs organized by production line
- **Card View**: Modern cards with hover effects
- **List View**: Table view for detailed comparison
- **Auto-refresh**: Updates every 30 seconds

### PC Details Page
- Clean, card-based layout
- PC information & file paths
- Available models management
- Download configuration files
- Apply models instantly

### Model Library (NEW!)
- Upload model ZIPs with description
- View all models in library
- Deploy to multiple PCs at once:
  - All PCs
  - By Version (3.5 or 4.0)
  - By Line (1, 2, 3, etc.)
  - By Version + Line combination
- Delete models from library

---

## 🔧 Agent Setup (Factory PCs)

### First Time Registration
1. Run `FactoryAgent.exe` on factory PC
2. Registration dialog will appear with:
   - Line Number
   - PC Number
   - **Version Selection (3.5 or 4.0)** ← NEW!
   - Config/Log/Model paths
   - Server URL
   - **IP Address automatically detected** ← NEW!

3. Click OK - Agent registers with server

### What Agent Does
- ✅ Monitors config file changes
- ✅ Monitors log files
- ✅ Tracks application running status
- ✅ Sends heartbeat every 15 seconds
- ✅ Receives commands from server
- ✅ Downloads and applies models
- ✅ Syncs available models

---

## 📊 Database Schema

### Tables Created
1. **FactoryPCs** - Factory PC information with ModelVersion
2. **ConfigFiles** - Configuration files
3. **LogFiles** - Log files
4. **Models** - Available models on each PC
5. **ModelFiles** - Model ZIPs stored in DB (with IsTemplate, Description, Category)
6. **ModelDistributions** - Distribution tracking
7. **AgentCommands** - Command queue
8. **SystemLogs** - System audit logs

### Model Library Enhancement
- `IsTemplate` = 1: Model library templates
- `IsTemplate` = 0: Models uploaded from agents
- `Description`: Model details
- `Category`: Organization (e.g., Production, Testing)

---

## 🔌 API Endpoints

### React Frontend APIs

```
GET  /api/api/versions          - Get available versions
GET  /api/api/lines             - Get production lines
GET  /api/api/pcs               - Get PCs (with filters)
GET  /api/api/pc/:id            - Get PC details
GET  /api/api/stats             - Get statistics
```

### Model Library APIs

```
GET    /api/modellibrary              - Get library models
POST   /api/modellibrary/upload       - Upload model
POST   /api/modellibrary/apply        - Deploy model to PCs
DELETE /api/modellibrary/:id          - Delete model
GET    /api/modellibrary/download/:id - Download model
```

### Agent APIs

```
POST /api/agent/register       - Agent registration
POST /api/agent/heartbeat      - Heartbeat with commands
POST /api/agent/updateconfig   - Upload config
POST /api/agent/syncmodels     - Sync models
GET  /api/agent/downloadmodel/:id - Download model ZIP
```

---

## 🎯 Usage Workflows

### Deploy Model to Multiple PCs

1. **Upload to Library**:
   - Go to Model Library page
   - Click "Upload Model"
   - Select ZIP file
   - Add name, description, category
   - Click Upload

2. **Deploy to PCs**:
   - Click "Deploy" on model
   - Select target:
     - All PCs
     - Version 3.5 or 4.0
     - Line 1, 2, 3, etc.
     - Version + Line combo
   - Check "Apply immediately"
   - Click "Deploy Now"

3. **What Happens**:
   - Model stored in database
   - Commands created for target PCs
   - Agents download model on next heartbeat
   - Agents extract and apply model
   - Dashboard updates in real-time

### Monitor Factory PCs

1. **Select Version** in sidebar (or "All Versions")
2. **View PCs** organized by line
3. **See Status**: Online/Offline, Running/Stopped
4. **Click PC** to see details
5. **Manage Models** for individual PC

### Register New PC

1. Install agent on factory PC
2. Run FactoryAgent.exe
3. Fill in registration:
   - Line number
   - PC number
   - Select version (3.5 or 4.0)
   - Paths (use defaults)
   - Server URL
4. IP automatically detected
5. Agent appears in dashboard

---

## 🔥 Key Improvements Made

### Agent ✅
- ✅ Version dropdown (3.5 / 4.0)
- ✅ Automatic IP detection (no manual entry)
- ✅ Updated C++ code and dialogs

### Database ✅
- ✅ Complete schema with all 8 tables
- ✅ Model library support (IsTemplate, Description, Category)
- ✅ Proper indexes and relationships
- ✅ SQL scripts ready to execute

### Backend ✅
- ✅ New API controllers for React
- ✅ Model Library controller with full CRUD
- ✅ Enhanced model file handling
- ✅ Support for version + line filtering

### Frontend 🆕
- 🆕 Complete React app with TypeScript
- 🆕 Modern industrial dark theme
- 🆕 Professional component library
- 🆕 Real-time updates
- 🆕 Model library page
- 🆕 Clean dashboard with sidebar navigation
- 🆕 PC details without clutter
- 🆕 Responsive design

---

## 🎨 Design System

### Colors
```css
Primary:   #4f7ee0 (Industrial Blue)
Success:   #10b981 (Green)
Danger:    #ef4444 (Red)
Warning:   #f59e0b (Orange)
Background: #0f1419, #1c2128 (Dark)
```

### Typography
- **Primary**: Inter (modern, clean)
- **Monospace**: For IPs, model names

### Components
- Modern cards with hover effects
- Gradient buttons with shadows
- Professional badges
- Smooth transitions (150-350ms)
- Status indicators with glow

---

## 📱 Responsive Design

- ✅ Desktop optimized
- ✅ Tablet friendly
- ✅ Mobile compatible
- ✅ Sidebar collapses on mobile

---

## 🛠️ Development

### Backend Development
```bash
cd FactoryMonitoringWeb
dotnet watch run  # Hot reload
```

### Frontend Development
```bash
cd factory-react-ui
npm run dev  # Vite hot reload
```

### Agent Development
- Open `FactoryAgent.sln` in Visual Studio
- Build solution
- Test on factory PC

---

## 📦 Production Deployment

### Option 1: Serve React from ASP.NET

```bash
# Build React
cd factory-react-ui
npm run build

# Copy to ASP.NET wwwroot
cp -r dist/* ../FactoryMonitoringWeb/wwwroot/

# Deploy ASP.NET
cd ../FactoryMonitoringWeb
dotnet publish -c Release
```

### Option 2: Separate Frontend Server

```bash
# Build React
cd factory-react-ui
npm run build

# Serve with nginx/IIS
# Point backend proxy to ASP.NET URL
```

---

## ✅ Testing Checklist

### Database
- [ ] All SQL scripts execute without errors
- [ ] All 8 tables created
- [ ] Indexes created
- [ ] Test data inserted

### Backend
- [ ] Server starts on port 5000
- [ ] All API endpoints respond
- [ ] CORS configured for React

### Frontend
- [ ] Runs on port 3000
- [ ] Connects to backend
- [ ] Dashboard loads PCs
- [ ] Version filtering works
- [ ] Model library works
- [ ] PC details page works

### Agent
- [ ] Registration dialog shows version dropdown
- [ ] IP auto-detected
- [ ] Registers successfully
- [ ] Appears in dashboard
- [ ] Heartbeat working
- [ ] Commands received

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check backend is running on port 5000
- Verify CORS settings in Program.cs
- Check proxy in vite.config.ts

### Database errors
- Verify SQL Server running
- Check connection string in appsettings.json
- Run migration scripts in order

### Agent won't register
- Check server URL in dialog
- Verify backend API is accessible
- Check firewall rules

---

## 🎓 Next Steps

1. **Customize**: Update colors, branding, logos
2. **Deploy**: Set up on production servers
3. **Scale**: Add more factory lines
4. **Monitor**: Watch real-time updates
5. **Manage**: Upload and deploy models

---

## 📝 Summary

You now have a **complete, professional, modern factory monitoring system** with:

- 🎨 Beautiful dark industrial UI (React)
- 🚀 Fast, scalable backend (ASP.NET Core)
- 💾 Robust database (SQL Server)
- 🤖 Lightweight agent (C++)
- 📦 Model library system
- 🔄 Real-time updates
- 📱 Responsive design
- ✨ Professional aesthetics

**Everything is ready to deploy!** 🚀

