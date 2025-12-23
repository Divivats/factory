# Running Factory Monitoring in Visual Studio

## Method 1: Open and Run Backend in Visual Studio

### Step 1: Open the Solution
1. Open **Visual Studio 2022**
2. Click **"Open a project or solution"**
3. Navigate to: `C:\Users\Divyansh V\Desktop\project\FactoryMonitoringWeb`
4. Open `FactoryMonitoringWeb.csproj`

### Step 2: Configure Startup
1. Right-click on the project in **Solution Explorer**
2. Select **"Properties"**
3. Go to **"Debug"** → **"General"**
4. Make sure **"Launch browser"** is set to: `http://localhost:5000`

### Step 3: Run the Backend
1. Press **F5** or click **"Start Debugging"** (green play button)
2. Backend will start on `http://localhost:5000`
3. **Keep Visual Studio running** (don't close it)

### Step 4: Start the React Frontend
1. Open a **new Command Prompt** (separate window)
2. Run:
   ```cmd
   cd "C:\Users\Divyansh V\Desktop\project\factory-react-ui"
   npm run dev
   ```
3. Open browser to **http://localhost:3000**

---

## Method 2: Run Both Backend and Frontend Together

### Option A: Use the Batch Files (Easiest)

Double-click **`START_HERE.bat`** in your project folder. This will:
- Open backend in one terminal
- Open frontend in another terminal
- Everything starts automatically!

### Option B: Configure Visual Studio to Start Both

1. **In Visual Studio**, go to **Tools** → **External Tools**
2. Click **"Add"**
3. Set:
   - **Title:** Start React Frontend
   - **Command:** `cmd.exe`
   - **Arguments:** `/k cd "C:\Users\Divyansh V\Desktop\project\factory-react-ui" && npm run dev`
   - **Initial directory:** `C:\Users\Divyansh V\Desktop\project\factory-react-ui`

4. Now you can start:
   - Backend: Press **F5** in Visual Studio
   - Frontend: **Tools** → **External Tools** → **Start React Frontend**

---

## Method 3: Add npm Task to Visual Studio (Advanced)

### Step 1: Install Node.js Tools
1. In Visual Studio, go to **Tools** → **Get Tools and Features**
2. Check **"Node.js development"**
3. Install and restart Visual Studio

### Step 2: Add Frontend Project
1. Right-click solution in **Solution Explorer**
2. **Add** → **Existing Project**
3. Browse to: `factory-react-ui\package.json`
4. Visual Studio will recognize it as a Node.js project

### Step 3: Configure Multi-Project Startup
1. Right-click the **Solution** in Solution Explorer
2. Select **"Set Startup Projects"**
3. Choose **"Multiple startup projects"**
4. Set both projects to **"Start"**

---

## Debugging in Visual Studio

### Backend (C# ASP.NET Core)
- Set breakpoints in controllers
- Press **F5** to debug
- Use **Debug** → **Windows** → **Output** to see logs

### Frontend (React)
- Open browser **Developer Tools** (F12)
- Go to **Console** tab for React errors
- Go to **Network** tab to see API calls

---

## Recommended Setup

**Keep TWO windows open:**

1. **Visual Studio** - Running the backend (F5)
   - Shows API logs
   - Allows C# debugging
   - Auto-reloads on code changes

2. **Command Prompt** - Running the frontend
   ```cmd
   cd factory-react-ui
   npm run dev
   ```
   - Hot Module Replacement (instant UI updates)
   - Shows React build logs

---

## Quick Start Commands

### Start Backend (Visual Studio)
```
Press F5 in Visual Studio
```

### Start Frontend (Command Line)
```cmd
cd "C:\Users\Divyansh V\Desktop\project\factory-react-ui"
npm run dev
```

### Or Use Batch File
```cmd
START_HERE.bat
```

---

## Troubleshooting

### "Port 5000 already in use"
```cmd
netstat -ano | findstr :5000
taskkill /F /PID <PID>
```

### "npm command not found"
Make sure Node.js is installed and in your PATH

### Backend doesn't start
- Check SQL Server is running
- Verify connection string in `appsettings.json`
- Run database setup: `setup-database.bat`

### Frontend shows errors
```cmd
cd factory-react-ui
rmdir /s /q node_modules\.vite
npm run dev
```

---

## Production Build

### Build React for Production
```cmd
cd factory-react-ui
npm run build
```
This creates optimized files in `factory-react-ui/dist`

### Serve from ASP.NET Core
Configure `Program.cs` to serve the React build:
```csharp
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "../factory-react-ui/dist")),
    RequestPath = ""
});
```

---

**That's it! You're all set to develop in Visual Studio!** 🚀

