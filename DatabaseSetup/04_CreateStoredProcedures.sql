USE FactoryMonitoringDB;
GO

CREATE PROCEDURE sp_RegisterOrUpdatePC
    @LineNumber INT,
    @PCNumber INT,
    @IPAddress NVARCHAR(50),
    @ConfigFilePath NVARCHAR(500),
    @LogFilePath NVARCHAR(500),
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
            LogFilePath,
            ModelFolderPath,
            ModelVersion,
            IsOnline,
            IsApplicationRunning,
            LastHeartbeat
        )
        VALUES (
            @LineNumber,
            @PCNumber,
            @IPAddress,
            @ConfigFilePath,
            @LogFilePath,
            @ModelFolderPath,
            @ModelVersion,
            1,
            0,
            GETDATE()
        );

        SET @PCId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE FactoryPCs
        SET IPAddress = @IPAddress,
            ConfigFilePath = @ConfigFilePath,
            LogFilePath = @LogFilePath,
            ModelFolderPath = @ModelFolderPath,
            ModelVersion = @ModelVersion,
            IsOnline = 1,
            LastHeartbeat = GETDATE(),
            LastUpdated = GETDATE()
        WHERE PCId = @PCId;
    END
END
GO
