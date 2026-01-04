USE FactoryMonitoringDB;
GO

CREATE OR ALTER PROCEDURE sp_RegisterOrUpdatePC
    @LineNumber INT,
    @PCNumber INT,
    @IPAddress NVARCHAR(50),
    @ConfigFilePath NVARCHAR(500),
    @LogFolderPath NVARCHAR(500), -- Renamed parameter
    @ModelFolderPath NVARCHAR(500),
    @ModelVersion NVARCHAR(20) = '3.5',
    @PCId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @PCId = PCId
    FROM FactoryPCs
    WHERE LineNumber = @LineNumber
      AND PCNumber = @PCNumber;

    IF @PCId IS NULL
    BEGIN
        INSERT INTO FactoryPCs (
            LineNumber,
            PCNumber,
            IPAddress,
            ConfigFilePath,
            LogFolderPath, -- Renamed column
            ModelFolderPath,
            ModelVersion,
            IsOnline,
            IsApplicationRunning,
            LastHeartbeat,
            RegisteredDate,
            LastUpdated
        )
        VALUES (
            @LineNumber,
            @PCNumber,
            @IPAddress,
            @ConfigFilePath,
            @LogFolderPath,
            @ModelFolderPath,
            @ModelVersion,
            1,
            0,
            GETDATE(),
            GETDATE(),
            GETDATE()
        );

        SET @PCId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE FactoryPCs
        SET IPAddress = @IPAddress,
            ConfigFilePath = @ConfigFilePath,
            LogFolderPath = @LogFolderPath, -- Renamed column
            ModelFolderPath = @ModelFolderPath,
            ModelVersion = @ModelVersion,
            IsOnline = 1,
            LastHeartbeat = GETDATE(),
            LastUpdated = GETDATE()
        WHERE PCId = @PCId;
    END
END
GO

PRINT 'Stored procedure sp_RegisterOrUpdatePC updated successfully!';
GO