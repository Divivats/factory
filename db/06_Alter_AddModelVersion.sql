USE FactoryMonitoringDB;
GO

IF COL_LENGTH('FactoryPCs', 'ModelVersion') IS NULL
BEGIN
    ALTER TABLE FactoryPCs
    ADD ModelVersion NVARCHAR(20) NOT NULL CONSTRAINT DF_FactoryPC_ModelVersion DEFAULT '3.5';

    PRINT 'ModelVersion column added to FactoryPCs (default = 3.5).';
END
ELSE
BEGIN
    PRINT 'ModelVersion column already exists on FactoryPCs. No changes made.';
END
GO


