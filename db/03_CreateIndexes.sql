USE FactoryMonitoringDB;
GO

-- ============================================
-- INDEXES FOR FactoryPCs
-- ============================================
CREATE INDEX IX_FactoryPCs_LineNumber ON FactoryPCs(LineNumber);
CREATE INDEX IX_FactoryPCs_IsOnline ON FactoryPCs(IsOnline);
CREATE INDEX IX_FactoryPCs_LastHeartbeat ON FactoryPCs(LastHeartbeat);
CREATE INDEX IX_FactoryPCs_ModelVersion ON FactoryPCs(ModelVersion);
GO

-- ============================================
-- INDEXES FOR ConfigFiles
-- ============================================
CREATE INDEX IX_ConfigFiles_PCId ON ConfigFiles(PCId);
CREATE INDEX IX_ConfigFiles_PendingUpdate ON ConfigFiles(PendingUpdate);
GO

-- ============================================
-- INDEXES FOR LogFiles
-- ============================================
CREATE INDEX IX_LogFiles_PCId ON LogFiles(PCId);
CREATE INDEX IX_LogFiles_LastModified ON LogFiles(LastModified);
GO

-- ============================================
-- INDEXES FOR Models
-- ============================================
CREATE INDEX IX_Models_PCId ON Models(PCId);
CREATE INDEX IX_Models_IsCurrentModel ON Models(IsCurrentModel);
CREATE INDEX IX_Models_ModelName ON Models(ModelName);
GO

-- ============================================
-- INDEXES FOR ModelFiles
-- ============================================
CREATE INDEX IX_ModelFiles_IsActive ON ModelFiles(IsActive);
CREATE INDEX IX_ModelFiles_UploadedDate ON ModelFiles(UploadedDate);
GO

-- ============================================
-- INDEXES FOR ModelDistributions
-- ============================================
CREATE INDEX IX_ModelDistributions_ModelFileId ON ModelDistributions(ModelFileId);
CREATE INDEX IX_ModelDistributions_PCId ON ModelDistributions(PCId);
CREATE INDEX IX_ModelDistributions_Status ON ModelDistributions(Status);
CREATE INDEX IX_ModelDistributions_DistributionType ON ModelDistributions(DistributionType);
GO

-- ============================================
-- INDEXES FOR AgentCommands
-- ============================================
CREATE INDEX IX_AgentCommands_PCId ON AgentCommands(PCId);
CREATE INDEX IX_AgentCommands_Status ON AgentCommands(Status);
CREATE INDEX IX_AgentCommands_CommandType ON AgentCommands(CommandType);
CREATE INDEX IX_AgentCommands_PCId_Status ON AgentCommands(PCId, Status);
CREATE INDEX IX_AgentCommands_CreatedDate ON AgentCommands(CreatedDate);
GO

-- ============================================
-- INDEXES FOR SystemLogs
-- ============================================
CREATE INDEX IX_SystemLogs_PCId ON SystemLogs(PCId);
CREATE INDEX IX_SystemLogs_ActionType ON SystemLogs(ActionType);
CREATE INDEX IX_SystemLogs_Timestamp ON SystemLogs(Timestamp);
GO

PRINT 'All indexes created successfully!';
GO
