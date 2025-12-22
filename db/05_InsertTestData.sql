USE FactoryMonitoringDB;
GO

INSERT INTO FactoryPCs
(
    LineNumber,
    PCNumber,
    IPAddress,
    ConfigFilePath,
    LogFilePath,
    ModelFolderPath,
    ModelVersion,
    IsOnline,
    IsApplicationRunning,
    LastHeartbeat
)
VALUES
(1, 1, '192.168.1.101', 'C:\LAI\config.ini', 'C:\LAI\Log', 'C:\LAI\Model', '3.5', 0, 0, NULL),
(1, 2, '192.168.1.102', 'C:\LAI\config.ini', 'C:\LAI\Log', 'C:\LAI\Model', '3.5', 0, 0, NULL),
(1, 3, '192.168.1.103', 'C:\LAI\config.ini', 'C:\LAI\Log', 'C:\LAI\Model', '4.0', 0, 0, NULL);
GO

INSERT INTO FactoryPCs
(
    LineNumber,
    PCNumber,
    IPAddress,
    ConfigFilePath,
    LogFilePath,
    ModelFolderPath,
    ModelVersion,
    IsOnline,
    IsApplicationRunning,
    LastHeartbeat
)
VALUES
(2, 1, '192.168.1.201', 'C:\LAI\config.ini', 'C:\LAI\Log', 'C:\LAI\Model', '3.5', 0, 0, NULL),
(2, 2, '192.168.1.202', 'C:\LAI\config.ini', 'C:\LAI\Log', 'C:\LAI\Model', '4.0', 0, 0, NULL);
GO

INSERT INTO FactoryPCs
(
    LineNumber,
    PCNumber,
    IPAddress,
    ConfigFilePath,
    LogFilePath,
    ModelFolderPath,
    ModelVersion,
    IsOnline,
    IsApplicationRunning,
    LastHeartbeat
)
VALUES
(3, 1, '192.168.1.301', 'C:\LAI\config.ini', 'C:\LAI\Log', 'C:\LAI\Model', '4.0', 0, 0, NULL);
GO

PRINT 'Test data with versions inserted successfully!';


