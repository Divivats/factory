USE FactoryMonitoringDB;
GO

CREATE INDEX IX_FactoryPCs_LineNumber ON FactoryPCs(LineNumber);
CREATE INDEX IX_FactoryPCs_IsOnline ON FactoryPCs(IsOnline);
CREATE INDEX IX_FactoryPCs_LastHeartbeat ON FactoryPCs(LastHeartbeat);
GO

PRINT 'All indexes created successfully!';
