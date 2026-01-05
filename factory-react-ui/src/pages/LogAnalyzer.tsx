import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { factoryApi } from '../services/api';
import { logAnalyzerApi } from '../services/logAnalyzerApi';
import { parseLogContent } from '../utils/logParser';

import LoadingOverlay from '../components/LogAnalyzer/LoadingOverlay';
import PCSelectionList, { type PCWithVersion } from '../components/LogAnalyzer/PCSelectionList';
import LogFileSelector from '../components/LogAnalyzer/LogFileSelector';
import LogFileViewerModal from '../components/LogAnalyzer/LogFileViewerModal';
import AnalysisResultsModal from '../components/LogAnalyzer/AnalysisResultsModal';

import type { LogFileNode, LogFileContent, AnalysisResult } from '../types/logTypes';

export default function LogAnalyzer() {
    // State: Data
    const [pcs, setPCs] = useState<PCWithVersion[]>([]);
    const [logFiles, setLogFiles] = useState<LogFileNode[]>([]);
    const [fileContent, setFileContent] = useState<LogFileContent | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    // State: Selection
    const [selectedPC, setSelectedPC] = useState<PCWithVersion | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedBarrel, setSelectedBarrel] = useState<string | null>(null);

    // State: UI/Loading
    const [loadingPCs, setLoadingPCs] = useState(true);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadPCs();
    }, []);

    const loadPCs = async () => {
        setLoadingPCs(true);
        try {
            const data = await factoryApi.getPCs();
            const allPCs = data.lines.flatMap((line: any) =>
                line.pcs.map((pc: any) => ({
                    ...pc,
                    version: pc.modelVersion,
                    line: line.lineNumber
                }))
            );
            setPCs(allPCs);
        } catch (error) {
            console.error('Failed to load PCs:', error);
        } finally {
            setLoadingPCs(false);
        }
    };

    const handlePCClick = async (pc: PCWithVersion) => {
        setSelectedPC(pc);
        setLogFiles([]);
        setSelectedFile(null);
        setFileContent(null);
        setAnalysisResult(null);
        setSelectedBarrel(null);

        setLoadingFiles(true);
        try {
            const structure = await logAnalyzerApi.getLogStructure(pc.pcId);
            setLogFiles(structure.files);
        } catch (error: any) {
            alert(`Failed to load log files: ${error.message}`);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleFileClick = async (filePath: string) => {
        if (!selectedPC) return;

        setSelectedFile(filePath);
        setLoadingContent(true);

        try {
            const content = await logAnalyzerApi.getLogFileContent(selectedPC.pcId, filePath);
            setFileContent(content);
        } catch (error: any) {
            alert(`Failed to load file: ${error.message}`);
            setSelectedFile(null);
        } finally {
            setLoadingContent(false);
        }
    };

    const handleVisualize = () => {
        if (!fileContent) return;

        setAnalyzing(true);

        try {
            const result = parseLogContent(fileContent.content);

            // Small delay for UX (shows the user something is happening)
            setTimeout(() => {
                setAnalysisResult(result);
                setFileContent(null);
                setAnalyzing(false);
            }, 100);
        } catch (error: any) {
            alert(`Analysis failed: ${error.message}`);
            setAnalyzing(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedPC || !selectedFile || !fileContent) return;

        setDownloading(true);
        try {
            const blob = await logAnalyzerApi.downloadLogFile(selectedPC.pcId, selectedFile);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileContent.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            alert(`Download failed: ${error.message}`);
        } finally {
            setDownloading(false);
        }
    };

    const handleBarrelClick = (barrelId: string) => {
        setSelectedBarrel(barrelId);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Loading Overlays */}
            <AnimatePresence>
                {loadingContent && (
                    <LoadingOverlay
                        message="Loading Log File..."
                        submessage="Reading file content from PC"
                    />
                )}
                {analyzing && (
                    <LoadingOverlay
                        message="Analyzing Log File..."
                        submessage="Parsing barrel execution data"
                    />
                )}
                {downloading && (
                    <LoadingOverlay
                        message="Downloading..."
                        submessage="Preparing log file for download"
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, #3b82f6, #10b981)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                    }}>
                        <ScrollText size={22} color="#ffffff" />
                    </div>
                    <div>
                        <h1 style={{
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            margin: 0,
                            background: 'linear-gradient(135deg, #60a5fa, #34d399)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Log Analyzer
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-scroll-area" style={{
                flex: 1,
                overflow: 'hidden',
                padding: '1.5rem',
                background: 'var(--bg-app)'
            }}>
                <AnimatePresence mode="wait">
                    {!selectedPC ? (
                        <PCSelectionList
                            pcs={pcs}
                            onSelectPC={handlePCClick}
                            loading={loadingPCs}
                        />
                    ) : (
                        <LogFileSelector
                            logFiles={logFiles}
                            selectedFile={selectedFile}
                            onSelectFile={handleFileClick}
                            onBack={() => {
                                setSelectedPC(null);
                                setLogFiles([]);
                                setSelectedFile(null);
                                setFileContent(null);
                                setAnalysisResult(null);
                            }}
                            loading={loadingFiles}
                            pcInfo={{
                                line: selectedPC.line,
                                pcNumber: selectedPC.pcNumber,
                                logPath: selectedPC.logFilePath
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {fileContent && (
                    <LogFileViewerModal
                        fileContent={fileContent}
                        onClose={() => setFileContent(null)}
                        onVisualize={handleVisualize}
                        onDownload={handleDownload}
                        analyzing={analyzing}
                        downloading={downloading}
                    />
                )}

                {analysisResult && (
                    <AnalysisResultsModal
                        result={analysisResult}
                        selectedBarrel={selectedBarrel}
                        onBarrelClick={handleBarrelClick}
                        onClose={() => {
                            setAnalysisResult(null);
                            setSelectedBarrel(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}