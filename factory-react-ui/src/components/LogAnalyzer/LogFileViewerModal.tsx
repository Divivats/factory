// Log File Viewer Modal
// Location: src/components/LogAnalyzer/LogFileViewerModal.tsx

import { X, Download, BarChart3, FileText } from 'lucide-react';
import type { LogFileContent } from '../../types/logTypes';

interface Props {
    fileContent: LogFileContent;
    onClose: () => void;
    onAnalyze: () => void;
    onDownload: () => void;
    analyzing: boolean;
}

export default function LogFileViewerModal({ fileContent, onClose, onAnalyze, onDownload, analyzing }: Props) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: '1000px', maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <FileText size={24} color="var(--primary)" />
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {fileContent.fileName}
                            </h2>
                            <div
                                className="text-mono"
                                style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                            >
                                {fileContent.filePath}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-secondary btn-icon">
                        <X size={20} />
                    </button>
                </div>

                {/* Actions */}
                <div
                    style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center'
                    }}
                >
                    <button
                        className="btn btn-primary"
                        onClick={onAnalyze}
                        disabled={analyzing}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <BarChart3 size={18} />
                        {analyzing ? 'Analyzing...' : 'Analyze'}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onDownload}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Download size={18} />
                        Download
                    </button>
                    <div style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                        Size: {formatFileSize(fileContent.size)} • Encoding: {fileContent.encoding}
                    </div>
                </div>

                {/* Content */}
                <div
                    className="modal-body"
                    style={{
                        padding: 0,
                        maxHeight: 'calc(90vh - 200px)',
                        overflow: 'hidden'
                    }}
                >
                    <pre
                        className="text-mono"
                        style={{
                            margin: 0,
                            padding: '1.5rem',
                            background: 'var(--bg-app)',
                            color: 'var(--text-main)',
                            fontSize: '0.85rem',
                            lineHeight: 1.6,
                            overflowX: 'auto',
                            overflowY: 'auto',
                            maxHeight: 'calc(90vh - 200px)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                        }}
                    >
                        {fileContent.content}
                    </pre>
                </div>
            </div>
        </div>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}