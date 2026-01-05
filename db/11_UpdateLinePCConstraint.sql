/*
 * Migration: Update UC_LinePC Constraint to Include ModelVersion
 * 
 * Problem: Current constraint only enforces uniqueness on (LineNumber, PCNumber)
 * Solution: Drop old constraint and create new one with (LineNumber, PCNumber, ModelVersion)
 * 
 * This allows the same PC number to exist in different versions without conflict.
 */

USE FactoryMonitoring;
GO

-- Check if old constraint exists before dropping
IF EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UC_LinePC')
BEGIN
    PRINT 'Dropping old UC_LinePC constraint...';
    ALTER TABLE FactoryPCs DROP CONSTRAINT UC_LinePC;
    PRINT 'Old constraint dropped successfully.';
END
ELSE
BEGIN
    PRINT 'Old UC_LinePC constraint does not exist, skipping drop.';
END
GO

-- Create new constraint with ModelVersion included
IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UC_LinePC_Version')
BEGIN
    PRINT 'Creating new UC_LinePC_Version constraint...';
    ALTER TABLE FactoryPCs
    ADD CONSTRAINT UC_LinePC_Version UNIQUE (LineNumber, PCNumber, ModelVersion);
    PRINT 'New constraint created successfully.';
    PRINT 'PCs are now unique by (LineNumber, PCNumber, ModelVersion).';
END
ELSE
BEGIN
    PRINT 'UC_LinePC_Version constraint already exists, skipping creation.';
END
GO

PRINT 'Migration completed successfully!';
GO
