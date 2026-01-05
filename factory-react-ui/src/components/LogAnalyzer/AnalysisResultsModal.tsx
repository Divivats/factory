import { useState, useCallback, useEffect } from 'react';
import { X, BarChart3, Minimize2, Maximize2, Minimize, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BarrelExecutionChart from './BarrelExecutionChart';
import OperationGanttChart from './OperationGanttChart';
import type { AnalysisResult } from '../../types/logTypes';

interface Props {
    result: AnalysisResult;
    selectedBarrel: string | null;
    onBarrelClick: (barrelId: string) => void;
    onClose: () => void;
}

const ChartLoadingOverlay = ({ message }: { message: string }) => (
    <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-panel)',
    }}>
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
            <Loader2 size={32} color="#60a5fa" style={{ marginBottom: '1rem' }} />
        </motion.div>
        <span style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
            {message}
        </span>
    </div>
);

export default function AnalysisResultsModal({
    result,
    selectedBarrel,
    onBarrelClick,
    onClose
}: Props) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [expandedView, setExpandedView] = useState<'none' | 'barrel' | 'gantt'>('none');

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isChartReady, setIsChartReady] = useState(false);
    const [showEscTooltip, setShowEscTooltip] = useState(false);

    const selectedBarrelData = selectedBarrel ? result.barrels.find(b => b.barrelId === selectedBarrel) : null;

    const handleViewChange = (view: 'barrel' | 'gantt') => {
        setIsTransitioning(true);
        setIsChartReady(false);
        setExpandedView(prev => prev === view ? 'none' : view);
    };

    const handleCloseGantt = () => {
        if (expandedView === 'gantt') {
            handleViewChange('gantt');
        }
        onBarrelClick('');
    };

    const handleAnimationComplete = () => {
        setTimeout(() => {
            setIsTransitioning(false);
        }, 50);
    };

    const handleChartReady = useCallback(() => {
        requestAnimationFrame(() => {
            setIsChartReady(true);
        });
    }, []);

    // Handle Escape key to close graphs
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const showLoader = isTransitioning || !isChartReady;

    // Common style for the control buttons with borders
    const btnStyle = {
        padding: '0.35rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #334155',
        borderRadius: '6px',
        background: 'transparent',
        color: '#94a3b8',
        cursor: 'pointer',
        transition: 'all 0.2s'
    };

    // Card style override to prevent global hover effects (bouncing)
    const cardStyle = {
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        padding: 0,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        transform: 'none', // Override potential hover transforms
        transition: 'none' // Override potential hover transitions
    };

    // Unified Header Style for both panes
    const paneHeaderStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: 'rgba(30, 41, 59, 0.3)', // Consistent background
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
    };

    return (
        <AnimatePresence>
            {isMinimized ? (
                <motion.button
                    layoutId="analysis-window"
                    onClick={() => {
                        setIsTransitioning(true);
                        setIsChartReady(false);
                        setIsMinimized(false);
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: 'linear' }}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        background: '#3b82f6',
                        border: '1px solid #2563eb',
                        borderRadius: '12px',
                        padding: '1rem 1.5rem',
                        cursor: 'pointer',
                        zIndex: 1000,
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <BarChart3 size={20} color="#ffffff" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                            Analysis Results
                        </span>
                    </div>
                </motion.button>
            ) : (
                <motion.div
                    layoutId="analysis-window"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'linear' }}
                    onAnimationComplete={handleAnimationComplete}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'var(--bg-app)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                    // Note: Removed "modal-overlay" class to fix width issue, added graph-overlay for detection
                    className="graph-overlay"
                >
                    {/* Compact Main Header */}
                    <div style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--bg-panel)',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                        height: '48px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BarChart3 size={20} color="#60a5fa" />
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                                Log Analysis Results
                            </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-icon" onClick={() => setIsMinimized(true)} style={btnStyle}>
                                <Minimize2 size={16} />
                            </button>

                            <div style={{ position: 'relative' }}>
                                <button
                                    className="btn btn-secondary btn-icon"
                                    onClick={onClose}
                                    style={btnStyle}
                                >
                                    <X size={16} />
                                </button>

                                <AnimatePresence>
                                    {showEscTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                position: 'absolute',
                                                top: '115%',
                                                right: 0,
                                                background: '#1e293b',
                                                border: '1px solid #334155',
                                                color: '#f8fafc',
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                whiteSpace: 'nowrap',
                                                zIndex: 50,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                            }}
                                        >
                                            Press <b style={{ color: '#fff' }}>Esc</b> to close
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Charts Layout */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        overflow: 'hidden',
                        background: '#0f172a'
                    }}>
                        {/* Left: Barrel Execution Chart */}
                        <motion.div
                            animate={{
                                width: expandedView === 'barrel' ? '100%' : expandedView === 'gantt' ? '0%' : '40%',
                                opacity: expandedView === 'gantt' ? 0 : 1
                            }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            onAnimationComplete={handleAnimationComplete}
                            style={{
                                display: expandedView === 'gantt' ? 'none' : 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            <div className="card" style={cardStyle}>
                                {/* Compact Chart Header */}
                                <div style={paneHeaderStyle}>
                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#60a5fa', margin: 0 }}>
                                            Barrel Execution Times
                                        </h3>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {result.barrels.length} barrels analyzed
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-secondary btn-icon"
                                        onClick={() => handleViewChange('barrel')}
                                        title={expandedView === 'barrel' ? 'Restore' : 'Maximize'}
                                        style={btnStyle}
                                    >
                                        {expandedView === 'barrel' ? <Minimize size={16} /> : <Maximize2 size={16} />}
                                    </button>
                                </div>

                                <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: '1rem' }}>
                                    {showLoader && <ChartLoadingOverlay message="Resizing Layout..." />}

                                    {!isTransitioning && (
                                        <BarrelExecutionChart
                                            barrels={result.barrels}
                                            selectedBarrel={selectedBarrel}
                                            onBarrelClick={onBarrelClick}
                                            onReady={handleChartReady}
                                        />
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Gantt Chart */}
                        <motion.div
                            animate={{
                                width: expandedView === 'gantt' ? '100%' : expandedView === 'barrel' ? '0%' : '60%',
                                opacity: expandedView === 'barrel' ? 0 : 1
                            }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            onAnimationComplete={handleAnimationComplete}
                            style={{
                                display: expandedView === 'barrel' ? 'none' : 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {selectedBarrel && selectedBarrelData ? (
                                <div className="card" style={cardStyle}>
                                    {/* Compact Chart Header - Same Style as Left */}
                                    <div style={paneHeaderStyle}>
                                        <div>
                                            <h3 style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: '#60a5fa',
                                                margin: 0
                                            }}>
                                                Timeline: Barrel {selectedBarrel}
                                            </h3>
                                            <div className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                                                {selectedBarrelData.operations.length} operations • Total: {selectedBarrelData.totalExecutionTime}ms
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-secondary btn-icon"
                                                onClick={() => handleViewChange('gantt')}
                                                title={expandedView === 'gantt' ? 'Restore' : 'Maximize'}
                                                style={btnStyle}
                                            >
                                                {expandedView === 'gantt' ? <Minimize size={16} /> : <Maximize2 size={16} />}
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-icon"
                                                onClick={handleCloseGantt}
                                                style={btnStyle}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: '1rem' }}>
                                        {showLoader && <ChartLoadingOverlay message="Rendering Timeline..." />}

                                        {!isTransitioning && (
                                            <OperationGanttChart
                                                operations={selectedBarrelData.operations}
                                                barrelId={selectedBarrel}
                                                onReady={handleChartReady}
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="card" style={{
                                    padding: '3rem',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--bg-panel)',
                                    transform: 'none',
                                    transition: 'none'
                                }}>
                                    <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                                        <BarChart3 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                            Select a barrel to view operation timeline
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}