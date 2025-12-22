USE FactoryMonitoringDB;
GO

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

PRINT 'Core tables (including version column) created successfully!';


