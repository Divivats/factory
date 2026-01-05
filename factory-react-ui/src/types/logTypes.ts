export interface LogFileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
    modifiedDate?: string;
    children?: LogFileNode[];
}

export interface LogFileContent {
    fileName: string;
    filePath: string;
    content: string;
    size: number;
    encoding: string;
}

export interface OperationData {
    operationName: string;
    startTime: number;
    endTime: number;
    actualDuration: number;
    idealDuration: number;
    sequence: number;
}

export interface BarrelExecutionData {
    barrelId: string;
    totalExecutionTime: number;
    operations: OperationData[];
}

export interface AnalysisResult {
    barrels: BarrelExecutionData[];
    summary: {
        totalBarrels: number;
        averageExecutionTime: number;
        minExecutionTime: number;
        maxExecutionTime: number;
    };
}

export interface FactoryPC {
    pcId: number;
    pcNumber: number;
    lineNumber: number;
    ipAddress: string;
    isOnline: boolean;
    modelVersion: string;
    logFilePath: string;
}
