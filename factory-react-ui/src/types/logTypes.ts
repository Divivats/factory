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
    // Normalized times (starts at 0 for each barrel) - used for Barrel Analysis
    startTime: number;
    endTime: number;
    // Global/Absolute times (from log start) - used for Long Gantt
    globalStartTime: number;
    globalEndTime: number;
    actualDuration: number;
    idealDuration: number;
    sequence: number;
    barrelId: string; // Added for easy reference in tooltips/charts
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
    rawContent?: string; // Optional reference to raw content for Tab 3
    fileName?: string;   // Optional reference for display
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