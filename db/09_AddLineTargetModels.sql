-- ============================================
-- Migration: Add Line Target Model Tracking
-- Purpose: Track the intentionally deployed/target model for each production line
-- Date: 2025-12-31
-- ============================================

USE FactoryMonitoringDB;
GO

-- ============================================
-- TABLE: LineTargetModels
-- Stores the intended/target model for each line
-- Updated whenever a model is deployed via Manage Models or Model Library
-- ============================================

-- Check if table exists before creating
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LineTargetModels')
BEGIN
    CREATE TABLE LineTargetModels (
        LineTargetModelId INT PRIMARY KEY IDENTITY(1,1),
        LineNumber INT NOT NULL,
        TargetModelName NVARCHAR(255) NOT NULL,
        SetByUser NVARCHAR(100) NULL,  -- Optional: track who set it
        SetDate DATETIME DEFAULT GETDATE(),
        LastUpdated DATETIME DEFAULT GETDATE(),
        Notes NVARCHAR(500) NULL,  -- Optional: deployment notes
        CONSTRAINT UC_LineTargetModels_LineNumber UNIQUE(LineNumber)
    );
    PRINT 'LineTargetModels table created successfully!';
END
ELSE
BEGIN
    PRINT 'LineTargetModels table already exists!';
END
GO

-- Create index for faster line lookups (if not exists)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LineTargetModels_LineNumber' AND object_id = OBJECT_ID('LineTargetModels'))
BEGIN
    CREATE INDEX IX_LineTargetModels_LineNumber ON LineTargetModels(LineNumber);
    PRINT 'Index IX_LineTargetModels_LineNumber created';
END
ELSE
BEGIN
    PRINT 'Index IX_LineTargetModels_LineNumber already exists';
END
GO

-- ============================================
-- Initial Population (Optional)
-- Populate with current most common model per line
-- This gives a baseline for existing lines
-- Only insert if no records exist
-- ============================================
IF NOT EXISTS (SELECT 1 FROM LineTargetModels)
BEGIN
    INSERT INTO LineTargetModels (LineNumber, TargetModelName, SetByUser, Notes)
    SELECT 
        fp.LineNumber,
        ISNULL(
            (SELECT TOP 1 m.ModelName 
             FROM Models m 
             WHERE m.PCId IN (SELECT PCId FROM FactoryPCs WHERE LineNumber = fp.LineNumber)
               AND m.IsCurrentModel = 1
             GROUP BY m.ModelName 
             ORDER BY COUNT(*) DESC),
            'Not Set'
        ) AS TargetModelName,
        'System',
        'Auto-populated from most common current model'
    FROM FactoryPCs fp
    GROUP BY fp.LineNumber
    ORDER BY fp.LineNumber;
    
    PRINT 'LineTargetModels table populated with ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + ' lines!';
END
ELSE
BEGIN
    PRINT 'LineTargetModels already has data - skipping initial population';
END
GO

PRINT '';
PRINT '===========================================';
PRINT 'Line Target Model Tracking - Complete!';
PRINT '===========================================';
PRINT 'LineTargetModels table tracks the intended';
PRINT 'model for each line. Updated when:';
PRINT '  - Deploying via Manage Models';
PRINT '  - Deploying via Model Library';
PRINT '';
GO
