USE FactoryMonitoringDB;
GO

-- Add sample factory PCs if they don't exist
IF NOT EXISTS (SELECT 1 FROM FactoryPCs WHERE LineNumber = 1 AND PCNumber = 1)
BEGIN
    INSERT INTO FactoryPCs (LineNumber, PCNumber, IPAddress, ConfigFilePath, LogFilePath, ModelFolderPath, ModelVersion, IsOnline, IsApplicationRunning, LastHeartbeat)
    VALUES 
        (1, 1, '192.168.1.101', 'C:\Factory\Line1\PC1\config.ini', 'C:\Factory\Line1\PC1\logs', 'C:\Factory\Line1\PC1\models', '3.5', 1, 1, GETDATE()),
        (1, 2, '192.168.1.102', 'C:\Factory\Line1\PC2\config.ini', 'C:\Factory\Line1\PC2\logs', 'C:\Factory\Line1\PC2\models', '3.5', 1, 0, GETDATE()),
        (1, 3, '192.168.1.103', 'C:\Factory\Line1\PC3\config.ini', 'C:\Factory\Line1\PC3\logs', 'C:\Factory\Line1\PC3\models', '3.5', 0, 0, DATEADD(MINUTE, -5, GETDATE())),
        
        (2, 1, '192.168.2.101', 'C:\Factory\Line2\PC1\config.ini', 'C:\Factory\Line2\PC1\logs', 'C:\Factory\Line2\PC1\models', '4.0', 1, 1, GETDATE()),
        (2, 2, '192.168.2.102', 'C:\Factory\Line2\PC2\config.ini', 'C:\Factory\Line2\PC2\logs', 'C:\Factory\Line2\PC2\models', '4.0', 1, 1, GETDATE()),
        (2, 3, '192.168.2.103', 'C:\Factory\Line2\PC3\config.ini', 'C:\Factory\Line2\PC3\logs', 'C:\Factory\Line2\PC3\models', '4.0', 1, 0, GETDATE()),
        
        (3, 1, '192.168.3.101', 'C:\Factory\Line3\PC1\config.ini', 'C:\Factory\Line3\PC1\logs', 'C:\Factory\Line3\PC1\models', '3.5', 0, 0, DATEADD(HOUR, -1, GETDATE())),
        (3, 2, '192.168.3.102', 'C:\Factory\Line3\PC2\config.ini', 'C:\Factory\Line3\PC2\logs', 'C:\Factory\Line3\PC2\models', '4.0', 1, 1, GETDATE());
    
    PRINT 'Sample PCs added successfully!';
END
ELSE
BEGIN
    PRINT 'Sample PCs already exist.';
END
GO

-- Add sample config files for each PC
DECLARE @PCId INT;
DECLARE pc_cursor CURSOR FOR SELECT PCId FROM FactoryPCs WHERE NOT EXISTS (SELECT 1 FROM ConfigFiles WHERE ConfigFiles.PCId = FactoryPCs.PCId);

OPEN pc_cursor;
FETCH NEXT FROM pc_cursor INTO @PCId;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO ConfigFiles (PCId, ConfigContent, LastModified)
    VALUES (@PCId, 
        '[Application]
AppName=FactoryMonitor
Version=1.0
LogLevel=Info

[Camera]
Resolution=1920x1080
FPS=30
AutoExposure=True

[Processing]
Threads=4
BatchSize=10
Timeout=5000

[Server]
ServerURL=http://localhost:5000
HeartbeatInterval=10000
',
        GETDATE());
    
    FETCH NEXT FROM pc_cursor INTO @PCId;
END;

CLOSE pc_cursor;
DEALLOCATE pc_cursor;

PRINT 'Sample config files added!';
GO

-- Add sample models for each PC
DECLARE @PCId INT;
DECLARE @ModelVersion NVARCHAR(20);
DECLARE pc_cursor CURSOR FOR 
    SELECT PCId, ModelVersion FROM FactoryPCs 
    WHERE NOT EXISTS (SELECT 1 FROM Models WHERE Models.PCId = FactoryPCs.PCId);

OPEN pc_cursor;
FETCH NEXT FROM pc_cursor INTO @PCId, @ModelVersion;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Add 2-3 models per PC
    INSERT INTO Models (PCId, ModelName, ModelPath, IsCurrentModel, DiscoveredDate, LastUsed)
    VALUES 
        (@PCId, 'DefectDetection_v1.0', 'C:\Models\DefectDetection_v1.0', 0, DATEADD(DAY, -30, GETDATE()), DATEADD(DAY, -15, GETDATE())),
        (@PCId, 'QualityCheck_v2.5', 'C:\Models\QualityCheck_v2.5', 1, DATEADD(DAY, -10, GETDATE()), GETDATE()),
        (@PCId, 'Assembly_v1.5', 'C:\Models\Assembly_v1.5', 0, DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, -5, GETDATE()));
    
    FETCH NEXT FROM pc_cursor INTO @PCId, @ModelVersion;
END;

CLOSE pc_cursor;
DEALLOCATE pc_cursor;

PRINT 'Sample models added!';
GO

PRINT '';
PRINT '==============================================';
PRINT 'Sample data setup complete!';
PRINT '==============================================';
PRINT '';
PRINT 'Summary:';
PRINT '- 8 Factory PCs across 3 lines';
PRINT '- Config files for each PC';
PRINT '- 3 models per PC';
PRINT '';
PRINT 'You can now:';
PRINT '1. Start the backend: cd FactoryMonitoringWeb && dotnet run';
PRINT '2. Start the frontend: cd factory-react-ui && npm run dev';
PRINT '3. Open http://localhost:3000 in your browser';
PRINT '';
GO

