USE FactoryMonitoringDB;
GO

-- ============================================
-- TABLE: FactoryPCs
-- ============================================
-- NOTE: Table name must match EF Core mapping: [Table("FactoryPCs")]
CREATE TABLE FactoryPCs (
    PCId INT PRIMARY KEY IDENTITY(1,1),
    LineNumber INT NOT NULL,
    PCNumber INT NOT NULL,
    IPAddress NVARCHAR(50) NOT NULL,
    ConfigFilePath NVARCHAR(500) NOT NULL,
    LogFilePath NVARCHAR(500) NOT NULL,
    ModelFolderPath NVARCHAR(500) NOT NULL,
    ModelVersion NVARCHAR(20) NOT NULL DEFAULT '3.5',
    IsApplicationRunning BIT DEFAULT 0,
    IsOnline BIT DEFAULT 0,
    LastHeartbeat DATETIME NULL,
    RegisteredDate DATETIME DEFAULT GETDATE(),
    LastUpdated DATETIME DEFAULT GETDATE(),
    CONSTRAINT UC_LinePC UNIQUE(LineNumber, PCNumber)
);
GO

-- ============================================
-- TABLE: ConfigFiles
-- ============================================
CREATE TABLE ConfigFiles (
    ConfigId INT PRIMARY KEY IDENTITY(1,1),
    PCId INT NOT NULL,
    ConfigContent NVARCHAR(MAX) NOT NULL,
    LastModified DATETIME DEFAULT GETDATE(),
    PendingUpdate BIT DEFAULT 0,
    UpdatedContent NVARCHAR(MAX) NULL,
    UpdateRequestTime DATETIME NULL,
    UpdateApplied BIT DEFAULT 0,
    CONSTRAINT FK_ConfigFiles_FactoryPCs FOREIGN KEY (PCId) 
        REFERENCES FactoryPCs(PCId) ON DELETE CASCADE
);
GO

-- ============================================
-- TABLE: LogFiles
-- ============================================
CREATE TABLE LogFiles (
    LogId INT PRIMARY KEY IDENTITY(1,1),
    PCId INT NOT NULL,
    LogContent NVARCHAR(MAX) NOT NULL,
    LogFileName NVARCHAR(255) NOT NULL,
    LastModified DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_LogFiles_FactoryPCs FOREIGN KEY (PCId) 
        REFERENCES FactoryPCs(PCId) ON DELETE CASCADE
);
GO

-- ============================================
-- TABLE: Models
-- ============================================
CREATE TABLE Models (
    ModelId INT PRIMARY KEY IDENTITY(1,1),
    PCId INT NOT NULL,
    ModelName NVARCHAR(255) NOT NULL,
    ModelPath NVARCHAR(500) NOT NULL,
    IsCurrentModel BIT DEFAULT 0,
    DiscoveredDate DATETIME DEFAULT GETDATE(),
    LastUsed DATETIME NULL,
    CONSTRAINT FK_Models_FactoryPCs FOREIGN KEY (PCId) 
        REFERENCES FactoryPCs(PCId) ON DELETE CASCADE,
    CONSTRAINT UC_Model_PC_ModelName UNIQUE(PCId, ModelName)
);
GO

-- ============================================
-- TABLE: ModelFiles
-- ============================================
CREATE TABLE ModelFiles (
    ModelFileId INT PRIMARY KEY IDENTITY(1,1),
    ModelName NVARCHAR(255) NOT NULL,
    FileData VARBINARY(MAX) NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    FileSize BIGINT NOT NULL,
    UploadedDate DATETIME DEFAULT GETDATE(),
    UploadedBy NVARCHAR(100) NULL,
    IsActive BIT DEFAULT 1
);
GO

-- ============================================
-- TABLE: ModelDistributions
-- ============================================
CREATE TABLE ModelDistributions (
    DistributionId INT PRIMARY KEY IDENTITY(1,1),
    ModelFileId INT NOT NULL,
    PCId INT NULL,
    LineNumber INT NULL,
    DistributionType NVARCHAR(20) NOT NULL DEFAULT 'Single', -- 'Single', 'Line', 'Version', 'All'
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'InProgress', 'Completed', 'Failed'
    RequestedDate DATETIME DEFAULT GETDATE(),
    CompletedDate DATETIME NULL,
    ErrorMessage NVARCHAR(MAX) NULL,
    ApplyOnDownload BIT DEFAULT 0,
    CONSTRAINT FK_ModelDistributions_ModelFiles FOREIGN KEY (ModelFileId) 
        REFERENCES ModelFiles(ModelFileId) ON DELETE CASCADE,
    CONSTRAINT FK_ModelDistributions_FactoryPCs FOREIGN KEY (PCId) 
        REFERENCES FactoryPCs(PCId) ON DELETE SET NULL
);
GO

-- ============================================
-- TABLE: AgentCommands
-- ============================================
CREATE TABLE AgentCommands (
    CommandId INT PRIMARY KEY IDENTITY(1,1),
    PCId INT NOT NULL,
    CommandType NVARCHAR(50) NOT NULL, -- 'UpdateConfig', 'ChangeModel', 'DownloadModel', 'DeleteModel', 'UploadModel'
    CommandData NVARCHAR(MAX) NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'InProgress', 'Completed', 'Failed'
    CreatedDate DATETIME DEFAULT GETDATE(),
    ExecutedDate DATETIME NULL,
    ResultData NVARCHAR(MAX) NULL,
    ErrorMessage NVARCHAR(MAX) NULL,
    CONSTRAINT FK_AgentCommands_FactoryPCs FOREIGN KEY (PCId) 
        REFERENCES FactoryPCs(PCId) ON DELETE CASCADE
);
GO

-- ============================================
-- TABLE: SystemLogs
-- ============================================
CREATE TABLE SystemLogs (
    LogId INT PRIMARY KEY IDENTITY(1,1),
    PCId INT NULL,
    Action NVARCHAR(255) NOT NULL,
    ActionType NVARCHAR(50) NOT NULL DEFAULT 'Info', -- 'Info', 'Warning', 'Error', 'Success'
    Details NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(50) NULL,
    UserName NVARCHAR(100) NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_SystemLogs_FactoryPCs FOREIGN KEY (PCId) 
        REFERENCES FactoryPCs(PCId) ON DELETE SET NULL
);
GO

PRINT 'All tables created successfully!';
PRINT 'Tables created: FactoryPCs, ConfigFiles, LogFiles, Models, ModelFiles, ModelDistributions, AgentCommands, SystemLogs';
GO
