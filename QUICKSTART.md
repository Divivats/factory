# Factory Monitoring System - Quick Start Guide

## Prerequisites
- SQL Server (with SQLEXPRESS instance)
- .NET 6.0 or later
- Node.js 18+ and npm

## Setup Steps

### 1. Set Up the Database

Run the database setup script:
```bash
setup-database.bat
```

This will:
- Create the `FactoryMonitoringDB` database
- Create all required tables and indexes
- Add sample data (8 PCs across 3 lines with different versions)

### 2. Start the Application

#### Option A: Start Everything at Once (Recommended)
```bash
START_HERE.bat
```
This opens two terminal windows - one for backend, one for frontend.

#### Option B: Start Manually

**Terminal 1 - Backend:**
```bash
cd FactoryMonitoringWeb
dotnet run
```
Backend will start at: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd factory-react-ui
npm run dev
```
Frontend will start at: http://localhost:3000

### 3. Access the Application

Open your browser and go to: **http://localhost:3000**

You should see:
- **Sidebar** with version filters (3.5, 4.0) and line filters
- **Main dashboard** showing PCs grouped by production line
- **Cards/List view toggle** in the header
- **Model Library** link in the sidebar for managing model templates

## Testing the Setup

If you see 8 sample PCs displayed:
- Line 1: 3 PCs (version 3.5)
- Line 2: 3 PCs (version 4.0)
- Line 3: 2 PCs (mixed versions)

✅ **Your setup is working correctly!**

## Troubleshooting

### Frontend shows "Backend Server Not Running"
- Make sure the backend is running on http://localhost:5000
- Check the backend terminal for any errors
- Verify the database connection string in `FactoryMonitoringWeb/appsettings.json`

### Database Connection Error
- Ensure SQL Server is running
- Check the connection string: `Server=(local)\\SQLEXPRESS;Database=FactoryMonitoringDB;Trusted_Connection=True;TrustServerCertificate=True;`
- Try connecting with SQL Server Management Studio to verify

### Port Already in Use
- Backend (5000): Stop any other application using port 5000
- Frontend (3000): Stop any other application using port 3000, or the dev server will offer port 3001

## Next Steps

1. **Register a real agent**: Build and run the FactoryAgent project on a target PC
2. **Upload models**: Go to Model Library and upload your AI model ZIP files
3. **Distribute models**: Select a model and apply it to all PCs, by version, or by line
4. **Monitor status**: Watch real-time status updates every 30 seconds

## Project Structure

```
project/
├── db/                          # SQL setup scripts
├── FactoryAgent/               # C++ Windows agent application
├── FactoryMonitoringWeb/       # ASP.NET Core backend API
├── factory-react-ui/           # React TypeScript frontend
├── setup-database.bat          # Database setup script
├── START_HERE.bat              # Launch everything at once
├── start-backend.bat           # Launch backend only
└── start-frontend.bat          # Launch frontend only
```

## Features

### Dashboard
- Real-time PC monitoring grouped by production lines
- Online/offline status indicators
- Application running status
- Card and list view modes
- Filter by version or line number

### PC Details
- View detailed PC information
- Change active model
- Edit and update configuration files
- Download config files
- View all available models

### Model Library
- Upload model ZIP files with descriptions
- Categorize models (e.g., "Vision", "QA", "Assembly")
- Distribute models to:
  - All PCs
  - Specific version (3.5 or 4.0)
  - Specific production line
  - Individual PC
- Apply models immediately or queue for later

### Agent Features
- First-time registration with version selection (3.5/4.0)
- Automatic IP address detection
- Heartbeat monitoring
- Config file synchronization
- Model download and application
- Command execution (model change, config update)

## API Endpoints

All API endpoints are under: `http://localhost:5000/api/`

- `GET /api/Api/versions` - List all versions
- `GET /api/Api/lines` - List all production lines
- `GET /api/Api/pcs` - Get all PCs (with filtering)
- `GET /api/Api/pc/{id}` - Get PC details
- `GET /api/Api/stats` - Get dashboard statistics
- `GET /api/ModelLibrary` - List model templates
- `POST /api/ModelLibrary/upload` - Upload new model
- `DELETE /api/ModelLibrary/{id}` - Delete model
- `POST /api/ModelLibrary/apply` - Distribute model to PCs

## Support

For issues or questions, check:
- `COMPLETE_SETUP_GUIDE.md` for detailed instructions
- Backend logs in the terminal running `dotnet run`
- Browser console for frontend errors (F12)
- SQL Server logs for database issues

---

**Happy Monitoring! 🏭**

