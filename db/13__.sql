-- Check what constraints exist
SELECT name FROM sys.key_constraints 
WHERE parent_object_id = OBJECT_ID('LineTargetModels');
GO

-- Drop the old constraint (different name than we thought!)
IF EXISTS (SELECT * FROM sys.key_constraints 
           WHERE name = 'UC_LineTargetModels_LineNumber' 
           AND parent_object_id = OBJECT_ID('LineTargetModels'))
BEGIN
    ALTER TABLE LineTargetModels DROP CONSTRAINT UC_LineTargetModels_LineNumber;
    PRINT 'Dropped UC_LineTargetModels_LineNumber';
END
GO

-- Verify the new constraint exists
IF NOT EXISTS (SELECT * FROM sys.key_constraints 
               WHERE name = 'UC_LineNumber_Version')
BEGIN
    ALTER TABLE LineTargetModels 
    ADD CONSTRAINT UC_LineNumber_Version UNIQUE (LineNumber, ModelVersion);
    PRINT 'Created UC_LineNumber_Version';
END
GO