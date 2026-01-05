USE FactoryMonitoringDB;
GO

PRINT 'Starting Log Analyzer Support Migration...';
GO

-- ============================================
-- STEP 1: Rename LogFilePath to LogFolderPath
-- ============================================
-- Check if the old column exists before renaming
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FactoryPCs') AND name = 'LogFilePath')
BEGIN
    PRINT 'Renaming LogFilePath to LogFolderPath...';
    
    -- Use sp_rename to rename the column (preserves data)
    EXEC sp_rename 'FactoryPCs.LogFilePath', 'LogFolderPath', 'COLUMN';
    
    PRINT 'Column renamed successfully!';
END
ELSE
BEGIN
    PRINT 'LogFilePath column not found (may already be renamed or doesn''t exist). Skipping rename.';
END
GO

-- ============================================
-- STEP 2: Add LogStructureJson column
-- ============================================
-- Check if the column already exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FactoryPCs') AND name = 'LogStructureJson')
BEGIN
    PRINT 'Adding LogStructureJson column...';
    
    ALTER TABLE FactoryPCs
    ADD LogStructureJson NVARCHAR(MAX) NULL;
    
    PRINT 'LogStructureJson column added successfully!';
END
ELSE
BEGIN
    PRINT 'LogStructureJson column already exists. Skipping addition.';
END
GO

-- ============================================
-- VERIFICATION
-- ============================================
PRINT '';
PRINT '=== Migration Verification ===';
PRINT '';

-- Check if LogFolderPath exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FactoryPCs') AND name = 'LogFolderPath')
    PRINT '✓ LogFolderPath column exists';
ELSE
    PRINT '✗ ERROR: LogFolderPath column not found!';

-- Check if LogStructureJson exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FactoryPCs') AND name = 'LogStructureJson')
    PRINT '✓ LogStructureJson column exists';
ELSE
    PRINT '✗ ERROR: LogStructureJson column not found!';

-- Check if old LogFilePath column still exists (should not)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FactoryPCs') AND name = 'LogFilePath')
    PRINT '⚠ WARNING: LogFilePath column still exists (rename may have failed)';
ELSE
    PRINT '✓ LogFilePath column successfully renamed';

-- Show row count to verify no data loss
DECLARE @rowCount INT;
SELECT @rowCount = COUNT(*) FROM FactoryPCs;
PRINT '';
PRINT 'Total PC records: ' + CAST(@rowCount AS NVARCHAR(10));

PRINT '';
PRINT '=== Log Analyzer Support Migration Complete ===';
PRINT 'Database is now ready for Log Analyzer feature!';
GO
