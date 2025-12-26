import type { LogFileStructure, LogFileContent, AnalysisResult } from '../types/logTypes';

// IMPORTANT: Change this to match your backend URL
const API_BASE = 'http://localhost:5000/api';

export const logAnalyzerApi = {
    /**
     * Get log folder structure from a specific PC
     */
    async getLogStructure(pcId: number): Promise<LogFileStructure> {
        const response = await fetch(`${API_BASE}/LogAnalyzer/structure/${pcId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch log structure: ${response.statusText}`);
        }
        return response.json();
    },

    /**
     * Get content of a specific log file
     */
    async getLogFileContent(pcId: number, filePath: string): Promise<LogFileContent> {
        const response = await fetch(`${API_BASE}/LogAnalyzer/file/${pcId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch log file: ${response.statusText}`);
        }
        return response.json();
    },

    /**
     * Analyze log file and extract barrel execution data
     */
    async analyzeLogFile(pcId: number, filePath: string): Promise<AnalysisResult> {
        const response = await fetch(`${API_BASE}/LogAnalyzer/analyze/${pcId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
        });
        if (!response.ok) {
            throw new Error(`Failed to analyze log file: ${response.statusText}`);
        }
        return response.json();
    },

    /**
     * Download log file
     */
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