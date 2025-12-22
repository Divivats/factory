USE FactoryMonitoringDB;
GO

CREATE INDEX IX_FactoryPCs_LineNumber ON FactoryPCs(LineNumber);
CREATE INDEX IX_FactoryPCs_IsOnline ON FactoryPCs(IsOnline);
CREATE INDEX IX_FactoryPCs_LastHeartbeat ON FactoryPCs(LastHeartbeat);
CREATE INDEX IX_FactoryPCs_ModelVersion ON FactoryPCs(ModelVersion);
GO

PRINT 'Indexes (including version index) created successfully!';


