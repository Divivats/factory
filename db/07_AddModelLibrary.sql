USE FactoryMonitoringDB;
GO

-- ============================================
-- MODEL LIBRARY ENHANCEMENT
-- This creates a proper model library system
-- ============================================

-- Add IsTemplate column to ModelFiles to distinguish library templates from uploaded models
IF COL_LENGTH('ModelFiles', 'IsTemplate') IS NULL
BEGIN
    ALTER TABLE ModelFiles
    ADD IsTemplate BIT NOT NULL DEFAULT 0;
    PRINT 'IsTemplate column added to ModelFiles';
END
ELSE
BEGIN
    PRINT 'IsTemplate column already exists in ModelFiles';
END
GO

-- Add Description and Category for better organization
IF COL_LENGTH('ModelFiles', 'Description') IS NULL
BEGIN
    ALTER TABLE ModelFiles
    ADD Description NVARCHAR(500) NULL;
    PRINT 'Description column added to ModelFiles';
END
ELSE
BEGIN
    PRINT 'Description column already exists in ModelFiles';
END
GO

IF COL_LENGTH('ModelFiles', 'Category') IS NULL
BEGIN
    ALTER TABLE ModelFiles
    ADD Category NVARCHAR(100) NULL;
    PRINT 'Category column added to ModelFiles';
END
ELSE
BEGIN
    PRINT 'Category column already exists in ModelFiles';
END
GO

-- Add index for library queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ModelFiles_IsTemplate')
BEGIN
    CREATE INDEX IX_ModelFiles_IsTemplate ON ModelFiles(IsTemplate);
    PRINT 'Index IX_ModelFiles_IsTemplate created';
END
ELSE
BEGIN
    PRINT 'Index IX_ModelFiles_IsTemplate already exists';
END
GO

PRINT '';
PRINT '===========================================';
PRINT 'Model Library Enhancement Complete!';
PRINT '===========================================';
PRINT 'ModelFiles table now supports:';
PRINT '  - IsTemplate flag (library vs uploaded)';
PRINT '  - Description for model details';
PRINT '  - Category for organization';
PRINT '';
PRINT 'Use IsTemplate=1 for model library templates';
PRINT 'Use IsTemplate=0 for models uploaded from agents';
GO

