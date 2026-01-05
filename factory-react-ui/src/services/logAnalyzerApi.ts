import type { LogFileStructure, LogFileContent, AnalysisResult } from '../types/logTypes';

const API_BASE = '/api';

export const logAnalyzerApi = {
    async getLogStructure(pcId: number): Promise<LogFileStructure> {
        const response = await fetch(`${API_BASE}/LogAnalyzer/structure/${pcId}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to fetch log structure: ${response.statusText}`);
        }
        return response.json();
    },

    async getLogFileContent(pcId: number, filePath: string): Promise<LogFileContent> {
        const response = await fetch(`${API_BASE}/LogAnalyzer/file/${pcId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to fetch log file: ${response.statusText}`);
        }
        return response.json();
    },

    async downloadLogFile(pcId: number, filePath: string): Promise<Blob> {
        const response = await fetch(`${API_BASE}/LogAnalyzer/download/${pcId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
        });
        if (!response.ok) {
            throw new Error(`Failed to download log file: ${response.statusText}`);
        }
        return response.blob();
    }
};