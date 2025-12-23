@echo off
echo ============================================
echo Factory Monitoring Database Setup
echo ============================================
echo.
echo This script will create and set up the database.
echo Make sure SQL Server is running!
echo.
pause

cd db

echo.
echo [1/8] Creating database...
sqlcmd -S (local)\SQLEXPRESS -i 01_CreateDatabase.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database!
    pause
    exit /b 1
)

echo.
echo [2/8] Creating tables...
sqlcmd -S (local)\SQLEXPRESS -i 02_CreateTables.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create tables!
    pause
    exit /b 1
)

echo.
echo [3/8] Creating indexes...
sqlcmd -S (local)\SQLEXPRESS -i 03_CreateIndexes.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create indexes!
    pause
    exit /b 1
)

echo.
echo [4/8] Creating stored procedures...
sqlcmd -S (local)\SQLEXPRESS -i 04_CreateStoredProcedures.sql
if %errorlevel% neq 0 (
    echo WARNING: Failed to create stored procedures (optional)
)

echo.
echo [5/8] Creating views...
sqlcmd -S (local)\SQLEXPRESS -i 05_CreateViews.sql
if %errorlevel% neq 0 (
    echo WARNING: Failed to create views (optional)
)

echo.
echo [6/8] Setting up model library...
sqlcmd -S (local)\SQLEXPRESS -i 07_AddModelLibrary.sql
if %errorlevel% neq 0 (
    echo WARNING: Failed to set up model library (may already exist)
)

echo.
echo [7/8] Adding sample data...
sqlcmd -S (local)\SQLEXPRESS -i 08_AddSampleData.sql
if %errorlevel% neq 0 (
    echo WARNING: Failed to add sample data (may already exist)
)

cd ..

echo.
echo ============================================
echo Database setup complete!
echo ============================================
echo.
echo Next steps:
echo 1. Run start-backend.bat to start the ASP.NET Core server
echo 2. Run start-frontend.bat to start the React development server
echo 3. Open http://localhost:3000 in your browser
echo.
echo Or simply run START_HERE.bat to start both at once!
echo.
pause

