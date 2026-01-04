USE FactoryMonitoringDB;
GO

-- ============================================
-- 1. ADD SAMPLE FACTORY PCs
-- ============================================
IF NOT EXISTS (SELECT 1 FROM FactoryPCs WHERE LineNumber = 1 AND PCNumber = 1)
BEGIN
    INSERT INTO FactoryPCs (
        LineNumber, PCNumber, IPAddress, 
        ConfigFilePath, LogFolderPath, ModelFolderPath, -- Renamed LogFolderPath
        ModelVersion, IsOnline, IsApplicationRunning, 
        LastHeartbeat, LogStructureJson
    )
    VALUES 
        (1, 1, '192.168.1.101', 'C:\Factory\Line1\PC1\config.ini', 'C:\Factory\Line1\PC1\logs', 'C:\Factory\Line1\PC1\models', '3.5', 1, 1, GETDATE(), NULL),
        (1, 2, '192.168.1.102', 'C:\Factory\Line1\PC2\config.ini', 'C:\Factory\Line1\PC2\logs', 'C:\Factory\Line1\PC2\models', '3.5', 1, 0, GETDATE(), NULL),
        (1, 3, '192.168.1.103', 'C:\Factory\Line1\PC3\config.ini', 'C:\Factory\Line1\PC3\logs', 'C:\Factory\Line1\PC3\models', '3.5', 0, 0, DATEADD(MINUTE, -5, GETDATE()), NULL),
        
        (2, 1, '192.168.2.101', 'C:\Factory\Line2\PC1\config.ini', 'C:\Factory\Line2\PC1\logs', 'C:\Factory\Line2\PC1\models', '4.0', 1, 1, GETDATE(), NULL),
        (2, 2, '192.168.2.102', 'C:\Factory\Line2\PC2\config.ini', 'C:\Factory\Line2\PC2\logs', 'C:\Factory\Line2\PC2\models', '4.0', 1, 1, GETDATE(), NULL),
        (2, 3, '192.168.2.103', 'C:\Factory\Line2\PC3\config.ini', 'C:\Factory\Line2\PC3\logs', 'C:\Factory\Line2\PC3\models', '4.0', 1, 0, GETDATE(), NULL),
        
        (3, 1, '192.168.3.101', 'C:\Factory\Line3\PC1\config.ini', 'C:\Factory\Line3\PC1\logs', 'C:\Factory\Line3\PC1\models', '3.5', 0, 0, DATEADD(HOUR, -1, GETDATE()), NULL),
        (3, 2, '192.168.3.102', 'C:\Factory\Line3\PC2\config.ini', 'C:\Factory\Line3\PC2\logs', 'C:\Factory\Line3\PC2\models', '4.0', 1, 1, GETDATE(), NULL);
    
    PRINT 'Sample PCs added successfully!';
END
ELSE
BEGIN
    PRINT 'Sample PCs already exist.';
END
GO

-- ============================================
-- 2. ADD SAMPLE CONFIG FILES
-- ============================================
DECLARE @PCId_Config INT;
DECLARE config_cursor CURSOR FOR 
    SELECT PCId FROM FactoryPCs 
    WHERE NOT EXISTS (SELECT 1 FROM ConfigFiles WHERE ConfigFiles.PCId = FactoryPCs.PCId);

OPEN config_cursor;
FETCH NEXT FROM config_cursor INTO @PCId_Config;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO ConfigFiles (PCId, ConfigContent, LastModified)
    VALUES (@PCId_Config, 
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
    
    FETCH NEXT FROM config_cursor INTO @PCId_Config;
END;

CLOSE config_cursor;
DEALLOCATE config_cursor;

PRINT 'Sample config files added!';
GO

-- ============================================
-- 3. ADD SAMPLE MODELS (On Disk)
-- ============================================
DECLARE @PCId_Model INT;
DECLARE @ModelVersion NVARCHAR(20);
DECLARE model_cursor CURSOR FOR 
    SELECT PCId, ModelVersion FROM FactoryPCs 
    WHERE NOT EXISTS (SELECT 1 FROM Models WHERE Models.PCId = FactoryPCs.PCId);

OPEN model_cursor;
FETCH NEXT FROM model_cursor INTO @PCId_Model, @ModelVersion;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO Models (PCId, ModelName, ModelPath, IsCurrentModel, DiscoveredDate, LastUsed)
    VALUES 
        (@PCId_Model, 'DefectDetection_v1.0', 'C:\Models\DefectDetection_v1.0', 0, DATEADD(DAY, -30, GETDATE()), DATEADD(DAY, -15, GETDATE())),
        (@PCId_Model, 'QualityCheck_v2.5', 'C:\Models\QualityCheck_v2.5', 1, DATEADD(DAY, -10, GETDATE()), GETDATE()),
        (@PCId_Model, 'Assembly_v1.5', 'C:\Models\Assembly_v1.5', 0, DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, -5, GETDATE()));
    
    FETCH NEXT FROM model_cursor INTO @PCId_Model, @ModelVersion;
END;

CLOSE model_cursor;
DEALLOCATE model_cursor;

PRINT 'Sample models added!';
GO

-- ============================================
-- 4. ADD SAMPLE MODEL LIBRARY (Templates)
-- ============================================
IF NOT EXISTS (SELECT 1 FROM ModelFiles WHERE IsTemplate = 1)
BEGIN
    INSERT INTO ModelFiles (ModelName, FileData, FileName, FileSize, UploadedBy, IsActive, IsTemplate, Description, Category)
    VALUES 
        ('DefectDetection_Master', 0x00, 'defect_master.zip', 1048576, 'Admin', 1, 1, 'Standard model for scratch detection on all lens types.', 'Inspection'),
        ('OCR_Reader_v4', 0x00, 'ocr_v4.zip', 2048576, 'System', 1, 1, 'Optimized for reading serial numbers in low light.', 'OCR'),
        ('Assembly_Check_Final', 0x00, 'assembly_final.zip', 512000, 'QA_Team', 1, 1, 'Verifies component placement alignment.', 'Assembly');

    PRINT 'Sample Model Library templates added!';
END
ELSE
BEGIN
    PRINT 'Model Library templates already exist.';
END
GO

PRINT 'Sample data populated successfully!';
GO