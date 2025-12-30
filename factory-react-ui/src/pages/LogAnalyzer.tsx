// Complete Log Analyzer - Correct Implementation
// Location: src/pages/LogAnalyzer.tsx

import { useState, useEffect } from 'react';
import { ScrollText, ChevronRight, FolderOpen, FileText, Monitor, Box, Activity, Download, BarChart3, X, Minimize2 } from 'lucide-react';
import { factoryApi } from '../services/api';
import { logAnalyzerApi } from '../services/logAnalyzerApi';
import LoadingOverlay from '../components/LogAnalyzer/LoadingOverlay';
import BarrelExecutionChart from '../components/LogAnalyzer/BarrelExecutionChart';
import OperationGanttChart from '../components/LogAnalyzer/OperationGanttChart';
import type { FactoryPC } from '../types';
import type { LogFileNode, LogFileContent, AnalysisResult } from '../types/logTypes';

interface PCWithVersion extends FactoryPC {
    version: string;
    line: number;
}

interface FlatFileItem {
    path: string;
    name: string;
    size?: number;
    modifiedDate?: string;
    isDirectory: boolean;
    level: number;
    folderPath: string;
}

export default function LogAnalyzer() {
    // State management
    const [pcs, setPCs] = useState<PCWithVersion[]>([]);
    const [selectedPC, setSelectedPC] = useState<PCWithVersion | null>(null);
    const [logFiles, setLogFiles] = useState<LogFileNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<LogFileContent | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [selectedBarrel, setSelectedBarrel] = useState<string | null>(null);

    // Loading states
    const [loadingPCs, setLoadingPCs] = useState(true);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Load PCs on mount
    useEffect(() => {
        loadPCs();
    }, []);

    const loadPCs = async () => {
        setLoadingPCs(true);
        try {
            const data = await factoryApi.getPCs();
            const allPCs = data.lines.flatMap(line =>
                line.pcs.map(pc => ({
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

    const handleVisualize = async () => {
        if (!selectedPC || !selectedFile) return;

        setAnalyzing(true);
        try {
            const result = await logAnalyzerApi.analyzeLogFile(selectedPC.pcId, selectedFile);
            setAnalysisResult(result);
            setFileContent(null); // Close file viewer
        } catch (error: any) {
            alert(`Analysis failed: ${error.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedPC || !selectedFile || !fileContent) return;

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
        }
    };

    const handleBarrelClick = (barrelId: string) => {
        setSelectedBarrel(barrelId);
        // Smooth scroll to Gantt chart
        setTimeout(() => {
            const ganttElement = document.getElementById('gantt-chart-section');
            ganttElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Group PCs by version and line
    const groupedPCs = pcs.reduce((acc, pc) => {
        if (!acc[pc.version]) acc[pc.version] = {};
        if (!acc[pc.version][pc.line]) acc[pc.version][pc.line] = [];
        acc[pc.version][pc.line].push(pc);
        return acc;
    }, {} as Record<string, Record<number, PCWithVersion[]>>);

    // Flatten file structure with folder headers
    const flattenFiles = (nodes: LogFileNode[], level: number = 0, parentPath: string = ''): FlatFileItem[] => {
        const items: FlatFileItem[] = [];

        nodes.forEach(node => {
            if (node.isDirectory) {
                // Add folder as header
                items.push({
                    path: node.path,
                    name: node.name,
                    isDirectory: true,
                    level,
                    folderPath: parentPath
                });

                // Add children
                if (node.children) {
                    items.push(...flattenFiles(node.children, level + 1, node.path));
                }
            } else {
                // Add file
                items.push({
                    path: node.path,
                    name: node.name,
                    size: node.size,
                    modifiedDate: node.modifiedDate,
                    isDirectory: false,
                    level,
                    folderPath: parentPath
                });
            }
        });

        return items;
    };

    const flatFiles = flattenFiles(logFiles);

    return (
        <>
            {/* Loading Overlays */}
            {loadingContent && (
                <LoadingOverlay
                    message="Loading Log File..."
                    submessage="Reading file content from PC"
                />
            )}
            {analyzing && (
                <LoadingOverlay
                    message="Analyzing Log File..."
                    submessage="Extracting barrel execution data"
                />
            )}

            {/* Header */}
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ScrollText size={20} color="var(--primary)" />
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                        Log Analyzer
                    </h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-scroll-area">
                {loadingPCs ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                        Loading PCs...
                    </div>
                ) : !selectedPC ? (
                    /* PC List with Headers: Version -> Line -> PC */
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '2px solid var(--border)',
                            background: 'var(--bg-panel)'
                        }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
                                Select PC to Analyze Logs
                            </h2>
                        </div>

                        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {Object.entries(groupedPCs).map(([version, lines]) => (
                                <div key={version}>
                                    {/* Version Header */}
                                    <div style={{
                                        padding: '1rem 1.5rem',
                                        background: 'linear-gradient(90deg, var(--primary), transparent)',
                                        borderBottom: '1px solid var(--border)',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        backdropFilter: 'blur(8px)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Box size={18} color="var(--primary)" />
                                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                Version {version}
                                            </span>
                                        </div>
                                    </div>

                                    {Object.entries(lines).map(([line, linePCs]) => (
                                        <div key={line}>
                                            {/* Line Header */}
                                            <div style={{
                                                padding: '0.75rem 1.5rem 0.75rem 3rem',
                                                background: 'var(--bg-hover)',
                                                borderBottom: '1px solid var(--border)',
                                                position: 'sticky',
                                                top: 52,
                                                zIndex: 9
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <Activity size={16} color="var(--success)" />
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                                        Line {line}
                                                    </span>
                                                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                                                        {linePCs.length} PCs
                                                    </span>
                                                </div>
                                            </div>

                                            {/* PC Items */}
                                            {linePCs.map(pc => (
                                                <div
                                                    key={pc.pcId}
                                                    onClick={() => handlePCClick(pc)}
                                                    style={{
                                                        padding: '1rem 1.5rem 1rem 5rem',
                                                        borderBottom: '1px solid var(--border)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'var(--bg-hover)';
                                                        e.currentTarget.style.paddingLeft = '5.5rem';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.paddingLeft = '5rem';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <Monitor size={18} color="var(--text-muted)" />
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                                PC-{pc.pcNumber}
                                                            </div>
                                                            <div className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                                                {pc.ipAddress}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'}`}>
                                                            {pc.isOnline ? 'Online' : 'Offline'}
                                                        </span>
                                                        <ChevronRight size={18} color="var(--text-dim)" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Flat Log File List with Folder Headers */
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '2px solid var(--border)',
                            background: 'var(--bg-panel)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', margin: 0, marginBottom: '0.5rem' }}>
                                    Log Files - Line {selectedPC.line} PC-{selectedPC.pcNumber}
                                </h2>
                                <div className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                    {selectedPC.logFilePath}
                                </div>
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setSelectedPC(null);
                                    setLogFiles([]);
                                }}
                            >
                                ← Back to PCs
                            </button>
                        </div>

                        {loadingFiles ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                Loading log files...
                            </div>
                        ) : (
                            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {flatFiles.map((item, index) => (
                                    item.isDirectory ? (
                                        /* Folder Header - Flat, No Indentation */
                                        <div
                                            key={item.path}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                background: 'linear-gradient(90deg, var(--warning), transparent)',
                                                borderBottom: '1px solid var(--border)',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 5
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <FolderOpen size={16} color="var(--warning)" />
                                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        /* File Item - Flat, No Indentation */
                                        <div
                                            key={item.path}
                                            onClick={() => handleFileClick(item.path)}
                                            style={{
                                                padding: '1rem 1.5rem',
                                                borderBottom: '1px solid var(--border)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--bg-hover)';
                                                e.currentTarget.style.paddingLeft = '2rem';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.paddingLeft = '1.5rem';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <FileText size={16} color="var(--primary)" />
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</div>
                                                    {item.size && (
                                                        <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                                            {(item.size / 1024).toFixed(2)} KB • {item.modifiedDate}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={16} color="var(--text-dim)" />
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* File Content Modal (90% screen) */}
            {fileContent && (
                <div className="modal-overlay" onClick={() => setFileContent(null)}>
                    <div
                        className="modal-content"
                        style={{ maxWidth: '90vw', width: '90vw', maxHeight: '90vh', height: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{fileContent.fileName}</h2>
                                <div className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {fileContent.filePath}
                                </div>
                            </div>
                            <button onClick={() => setFileContent(null)} className="btn btn-secondary btn-icon">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* Action Bar */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                gap: '0.75rem',
                                background: 'var(--bg-panel)'
                            }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleVisualize}
                                    disabled={analyzing}
                                >
                                    <BarChart3 size={18} />
                                    {analyzing ? 'Analyzing...' : 'Visualize'}
                                </button>
                                <button className="btn btn-secondary" onClick={handleDownload}>
                                    <Download size={18} />
                                    Download
                                </button>
                                <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                                    Size: {(fileContent.size / 1024).toFixed(2)} KB
                                </div>
                            </div>

                            {/* Content */}
                            <pre
                                className="text-mono"
                                style={{
                                    margin: 0,
                                    padding: '1.5rem',
                                    background: 'var(--bg-app)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.8rem',
                                    lineHeight: 1.6,
                                    overflowX: 'auto',
                                    overflowY: 'auto',
                                    flex: 1,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                }}
                            >
                                {fileContent.content}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Visualization Modal (100% screen with minimize) */}
            {analysisResult && (
                <VisualizationModal
                    result={analysisResult}
                    selectedBarrel={selectedBarrel}
                    onBarrelClick={handleBarrelClick}
                    onClose={() => {
                        setAnalysisResult(null);
                        setSelectedBarrel(null);
                    }}
                />
            )}
        </>
    );
}

// Full-Screen Visualization Modal
function VisualizationModal({
    result,
    selectedBarrel,
    onBarrelClick,
    onClose
}: {
    result: AnalysisResult;
    selectedBarrel: string | null;
    onBarrelClick: (barrelId: string) => void;
    onClose: () => void;
}) {
    const [isMinimized, setIsMinimized] = useState(false);
    const selectedBarrelData = selectedBarrel ? result.barrels.find(b => b.barrelId === selectedBarrel) : null;

    if (isMinimized) {
        return (
            <div
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: 'var(--bg-card)',
                    border: '2px solid var(--primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    zIndex: 1000,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
                onClick={() => setIsMinimized(false)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <BarChart3 size={20} color="var(--primary)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Analysis Results</span>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--bg-app)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Top Bar */}
            <div style={{
                padding: '1rem 2rem',
                background: 'var(--bg-panel)',
                borderBottom: '2px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <BarChart3 size={24} color="var(--primary)" />
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                            Log Analysis Results
                        </h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                            {result.barrels.length} barrels analyzed
                            {result.summary?.averageExecutionTime && ` • Avg: ${result.summary.averageExecutionTime.toFixed(0)}ms`}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary btn-icon" onClick={() => setIsMinimized(true)}>
                        <Minimize2 size={20} />
                    </button>
                    <button className="btn btn-secondary btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {/* Bar Chart - Maximum Screen Space */}
                <div className="card" style={{
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    height: 'calc(100vh - 150px)',
                    minHeight: '700px'
                }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>
                        Barrel Execution Times - Click to View Details
                    </h3>
                    <div style={{ height: 'calc(100% - 40px)' }}>
                        <BarrelExecutionChart
                            barrels={result.barrels}
                            selectedBarrel={selectedBarrel}
                            onBarrelClick={onBarrelClick}
                        />
                    </div>
                </div>

                {/* Gantt Chart - Maximum Screen Space */}
                {selectedBarrel && selectedBarrelData && (
                    <div
                        id="gantt-chart-section"
                        className="card"
                        style={{
                            padding: '1.5rem',
                            height: 'calc(100vh - 150px)',
                            minHeight: '700px',
                            animation: 'slideIn 0.4s ease-out',
                            border: '2px solid var(--primary)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                    Operation Timeline - Barrel {selectedBarrel}
                                </h3>
                                <div className="text-mono" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                    {selectedBarrelData.operations.length} operations • Total: {selectedBarrelData.totalExecutionTime}ms
                                </div>
                            </div>
                            <button className="btn btn-secondary" onClick={() => onBarrelClick('')}>
                                Close Timeline
                            </button>
                        </div>
                        <div style={{ height: 'calc(100% - 70px)' }}>
                            <OperationGanttChart
                                operations={selectedBarrelData.operations}
                                barrelId={selectedBarrel}
                            />
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}