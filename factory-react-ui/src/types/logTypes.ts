// Enhanced Log Analyzer Types - Samsung Industry Grade
// Location: src/types/logTypes.ts

export interface LogFileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
    modifiedDate?: string;
    children?: LogFileNode[];
}

export interface LogFileStructure {
    pcId: number;
    rootPath: string;
    files: LogFileNode[];
}

export interface LogFileContent {
    fileName: string;
    filePath: string;
    content: string;
    size: number;
    encoding: string;
}

export interface BarrelExecutionData {
    barrelId: string;
    totalExecutionTime: number;
    operations: OperationData[];
}

export interface OperationData {
    operationName: string;
    startTime: number;
    endTime: number;
    actualDuration: number;
    idealDuration: number;
    sequence: number;
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

export interface LogAnalyzerState {
    selectedPC: number | null;
    logStructure: LogFileStructure | null;
    selectedFile: string | null;
    fileContent: LogFileContent | null;
    analysisResult: AnalysisResult | null;
    selectedBarrel: string | null;
    loading: boolean;
    error: string | null;
}