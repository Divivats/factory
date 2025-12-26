// Log Analyzer Main Page
// Location: src/pages/LogAnalyzer.tsx

import { useState } from 'react';
import { ScrollText, FolderOpen, AlertCircle } from 'lucide-react';
import PCSelector from '../components/LogAnalyzer/PCSelector';
import FileTree from '../components/LogAnalyzer/FileTree';
import LogFileViewerModal from '../components/LogAnalyzer/LogFileViewerModal';
import AnalysisResultsModal from '../components/LogAnalyzer/AnalysisResultsModal';
import { logAnalyzerApi } from '../services/logAnalyzerApi';
import type { LogAnalyzerState } from '../types/logTypes';

export default function LogAnalyzer() {
    const [state, setState] = useState<LogAnalyzerState>({
        selectedPC: null,
        logStructure: null,
        selectedFile: null,
        fileContent: null,
        analysisResult: null,
        selectedBarrel: null,
        loading: false,
        error: null
    });

    const [loadingStructure, setLoadingStructure] = useState(false);
    const [loadingFile, setLoadingFile] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Handle PC selection
    const handleSelectPC = async (pcId: number) => {
        setState(prev => ({ ...prev, selectedPC: pcId, logStructure: null, selectedFile: null, fileContent: null, analysisResult: null, error: null }));
        setLoadingStructure(true);

        try {
            const structure = await logAnalyzerApi.getLogStructure(pcId);
            setState(prev => ({ ...prev, logStructure: structure }));
        } catch (error: any) {
            setState(prev => ({ ...prev, error: error.message }));
        } finally {
            setLoadingStructure(false);
        }
    };

    // Handle file selection
    const handleSelectFile = async (filePath: string) => {
        if (!state.selectedPC) return;

        setState(prev => ({ ...prev, selectedFile: filePath, fileContent: null, analysisResult: null }));
        setLoadingFile(true);

        try {
            const content = await logAnalyzerApi.getLogFileContent(state.selectedPC, filePath);
            setState(prev => ({ ...prev, fileContent: content }));
        } catch (error: any) {
            setState(prev => ({ ...prev, error: error.message }));
        } finally {
            setLoadingFile(false);
        }
    };

    // Handle analyze
    const handleAnalyze = async () => {
        if (!state.selectedPC || !state.selectedFile) return;

        setAnalyzing(true);
        try {
            const result = await logAnalyzerApi.analyzeLogFile(state.selectedPC, state.selectedFile);
            setState(prev => ({ ...prev, analysisResult: result }));
        } catch (error: any) {
            setState(prev => ({ ...prev, error: error.message }));
            alert(`Analysis failed: ${error.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    // Handle download
    const handleDownload = async () => {
        if (!state.selectedPC || !state.selectedFile || !state.fileContent) return;

        try {
            const blob = await logAnalyzerApi.downloadLogFile(state.selectedPC, state.selectedFile);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = state.fileContent.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            alert(`Download failed: ${error.message}`);
        }
    };

    // Close modals
    const closeFileViewer = () => {
        setState(prev => ({ ...prev, fileContent: null, selectedFile: null }));
    };

    const closeAnalysisResults = () => {
        setState(prev => ({ ...prev, analysisResult: null }));
    };

    return (
        <>
            {/* Header */}
            <div className="main-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                        className="icon-box"
                        style={{
                            background: 'var(--bg-hover)',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ScrollText size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Log Analyzer</h1>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            View and analyze factory PC logs
                        </p>
                    </div>
                </div>

                <PCSelector
                    selectedPC={state.selectedPC}
                    onSelectPC={handleSelectPC}
                />
            </div>

            {/* Content */}
            <div className="main-content">
                {!state.selectedPC ? (
                    // Empty state
                    <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-dim)' }}>
                        <FolderOpen size={64} style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            No PC Selected
                        </h3>
                        <p>Select a PC from the dropdown above to view its log files</p>
                    </div>
                ) : loadingStructure ? (
                    // Loading
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                        <div className="pulse" style={{ margin: '0 auto 1rem', background: 'var(--primary)' }} />
                        Loading log file structure...
                    </div>
                ) : state.error ? (
                    // Error
                    <div
                        className="card"
                        style={{
                            padding: '2rem',
                            textAlign: 'center',
                            background: 'var(--danger-bg)',
                            border: '1px solid var(--danger)'
                        }}
                    >
                        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Error Loading Logs</h3>
                        <p style={{ color: 'var(--text-muted)' }}>{state.error}</p>
                    </div>
                ) : state.logStructure && state.logStructure.files.length > 0 ? (
                    // File tree
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                                Log Files
                            </h2>
                            <div
                                className="text-mono"
                                style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}
                            >
                                {state.logStructure.rootPath}
                            </div>
                        </div>
                        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <FileTree
                                nodes={state.logStructure.files}
                                selectedFile={state.selectedFile}
                                onSelectFile={handleSelectFile}
                            />
                        </div>
                    </div>
                ) : (
                    // No files
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <FolderOpen size={48} color="var(--text-dim)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No Log Files Found</h3>
                        <p style={{ color: 'var(--text-dim)' }}>
                            The log folder for this PC is empty
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {loadingFile && (
                <div className="modal-overlay">
                    <div style={{ textAlign: 'center', color: 'white' }}>
                        <div className="pulse" style={{ margin: '0 auto 1rem', background: 'var(--primary)' }} />
                        <div>Loading log file...</div>
                    </div>
                </div>
            )}

            {state.fileContent && (
                <LogFileViewerModal
                    fileContent={state.fileContent}
                    onClose={closeFileViewer}
                    onAnalyze={handleAnalyze}
                    onDownload={handleDownload}
                    analyzing={analyzing}
                />
            )}

            {state.analysisResult && (
                <AnalysisResultsModal
                    result={state.analysisResult}
                    onClose={closeAnalysisResults}
                />
            )}
        </>
    );
}