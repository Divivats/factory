import { X, Download, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LogFileContent } from '../../types/logTypes';

interface Props {
    fileContent: LogFileContent;
    onClose: () => void;
    onVisualize: () => void;
    onDownload: () => void;
    analyzing: boolean;
    downloading: boolean;
}

export default function LogFileViewerModal({
    fileContent,
    onClose,
    onVisualize,
    onDownload,
    analyzing,
    downloading
}: Props) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="modal-content"
                style={{
                    maxWidth: '90vw',
                    width: '90vw',
                    maxHeight: '90vh',
                    height: '90vh',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header" style={{
                    borderBottom: '2px solid var(--border)',
                    background: 'var(--bg-panel)'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            // CHANGED: Softer Gradient (Blue to Green) instead of Neon
                            background: 'linear-gradient(135deg, #60a5fa, #4ade80)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            {fileContent.fileName}
                        </h2>
                        <div className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {fileContent.filePath}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary btn-icon"
                        style={{
                            transition: 'all 0.2s',
                            transform: 'scale(1)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '2px solid var(--border)',
                        display: 'flex',
                        gap: '0.75rem',
                        background: 'linear-gradient(180deg, var(--bg-panel), var(--bg-app))',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn btn-primary"
                            onClick={onVisualize}
                            disabled={analyzing}
                            style={{
                                // CHANGED: Softer Matte Blue Background
                                background: '#3b82f6',
                                border: '1px solid #2563eb',
                                // CHANGED: Removed Neon Glow, replaced with subtle shadow
                                boxShadow: analyzing ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                            }}
                        >
                            <BarChart3 size={18} />
                            {analyzing ? 'Analyzing...' : 'Visualize'}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn btn-secondary"
                            onClick={onDownload}
                            disabled={downloading}
                        >
                            <Download size={18} />
                            {downloading ? 'Downloading...' : 'Download'}
                        </motion.button>

                        <div style={{
                            marginLeft: 'auto',
                            fontSize: '0.85rem',
                            color: 'var(--text-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap',
                            fontWeight: 600
                        }}>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)'
                            }}>
                                Size: {(fileContent.size / 1024).toFixed(2)} KB
                            </span>
                        </div>
                    </div>

                    <pre className="text-mono" style={{
                        margin: 0,
                        padding: '1.5rem',
                        background: 'var(--bg-app)',
                        color: 'var(--text-main)',
                        fontSize: '0.8rem',
                        lineHeight: 1.7,
                        overflowX: 'auto',
                        overflowY: 'auto',
                        flex: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        fontFamily: 'JetBrains Mono, monospace'
                    }}>
                        {fileContent.content}
                    </pre>
                </div>
            </motion.div>
        </motion.div>
    );
}