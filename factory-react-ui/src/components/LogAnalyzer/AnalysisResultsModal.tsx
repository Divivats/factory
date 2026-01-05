import { useState, useEffect } from 'react';
import { X, BarChart3, Minimize2, Maximize2, Minimize, Activity, FileText, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BarrelExecutionChart from './BarrelExecutionChart';
import OperationGanttChart from './OperationGanttChart';
import LongGanttChart from './LongGanttChart';
import type { AnalysisResult } from '../../types/logTypes';

interface Props {
    result: AnalysisResult;
    selectedBarrel: string | null;
    onBarrelClick: (barrelId: string) => void;
    onClose: () => void;
}

// Compact Button Style
const btnStyle = {
    padding: '0.25rem',
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

const tabBtnStyle = (isActive: boolean) => ({
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    border: 'none',
    background: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#ffffff' : '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s'
});

export default function AnalysisResultsModal({
    result,
    selectedBarrel,
    onBarrelClick,
    onClose
}: Props) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState<'timeline' | 'analysis' | 'logs'>('timeline');
    const [expandedView, setExpandedView] = useState<'none' | 'barrel' | 'gantt'>('none');

    useEffect(() => {
        if (activeTab === 'analysis' && !selectedBarrel && result.barrels.length > 0) {
            onBarrelClick(result.barrels[0].barrelId);
        }
    }, [activeTab, selectedBarrel, result.barrels, onBarrelClick]);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const selectedBarrelData = selectedBarrel ? result.barrels.find(b => b.barrelId === selectedBarrel) : null;

    const renderContent = () => {
        switch (activeTab) {
            case 'timeline':
                return (
                    <div className="card" style={{
                        height: '100%',
                        padding: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Legend removed to increase graph area */}
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <LongGanttChart barrels={result.barrels} />
                        </div>
                    </div>
                );

            case 'analysis':
                return (
                    <div style={{ display: 'flex', gap: '0.5rem', height: '100%' }}>
                        <motion.div
                            style={{
                                width: expandedView === 'gantt' ? '0%' : expandedView === 'barrel' ? '100%' : '40%',
                                display: expandedView === 'gantt' ? 'none' : 'flex',
                                flexDirection: 'column'
                            }}
                            layout
                        >
                            <div className="card" style={{ height: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa', margin: 0 }}>Barrel Comparison</h3>
                                    <button style={btnStyle} onClick={() => setExpandedView(prev => prev === 'barrel' ? 'none' : 'barrel')}>
                                        {expandedView === 'barrel' ? <Minimize size={14} /> : <Maximize2 size={14} />}
                                    </button>
                                </div>
                                <div style={{ flex: 1, padding: '0.5rem', minHeight: 0 }}>
                                    <BarrelExecutionChart
                                        barrels={result.barrels}
                                        selectedBarrel={selectedBarrel}
                                        onBarrelClick={onBarrelClick}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            style={{
                                width: expandedView === 'barrel' ? '0%' : expandedView === 'gantt' ? '100%' : '60%',
                                display: expandedView === 'barrel' ? 'none' : 'flex',
                                flexDirection: 'column'
                            }}
                            layout
                        >
                            <div className="card" style={{ height: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa', margin: 0 }}>
                                        {selectedBarrel ? `Sequence: Barrel ${selectedBarrel}` : 'Select a Barrel'}
                                    </h3>
                                    <button style={btnStyle} onClick={() => setExpandedView(prev => prev === 'gantt' ? 'none' : 'gantt')}>
                                        {expandedView === 'gantt' ? <Minimize size={14} /> : <Maximize2 size={14} />}
                                    </button>
                                </div>
                                <div style={{ flex: 1, padding: '0.5rem', minHeight: 0 }}>
                                    {selectedBarrelData ? (
                                        <OperationGanttChart operations={selectedBarrelData.operations} barrelId={selectedBarrel || ''} />
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                                            Select a barrel from the left chart
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                );

            case 'logs':
                return (
                    <div className="card" style={{ height: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
                        <pre style={{
                            margin: 0, padding: '1rem', overflow: 'auto', flex: 1,
                            fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5
                        }}>
                            {result.rawContent || "Log content not available in analysis mode."}
                        </pre>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isMinimized ? (
                <motion.button
                    layoutId="analysis-window"
                    onClick={() => setIsMinimized(false)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        position: 'fixed', bottom: '2rem', right: '2rem',
                        background: '#3b82f6', border: '1px solid #2563eb', borderRadius: '12px',
                        padding: '0.75rem 1.25rem', cursor: 'pointer', zIndex: 1000,
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)', color: '#fff', fontWeight: 700
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={18} /> Analysis
                    </div>
                </motion.button>
            ) : (
                <motion.div
                    layoutId="analysis-window"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="graph-overlay"
                    style={{
                        position: 'fixed', inset: 0, background: 'var(--bg-app)', zIndex: 1000,
                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}
                >
                    {/* Header & Tabs */}
                    <div style={{
                        padding: '0.5rem 1rem', // Compact Header Padding
                        background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={16} color="#3b82f6" />
                                </div>
                                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{result.fileName || 'Log Analysis'}</h2>
                            </div>

                            {/* TABS */}
                            <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                <button style={tabBtnStyle(activeTab === 'timeline')} onClick={() => setActiveTab('timeline')}>
                                    <LayoutList size={14} /> Timeline
                                </button>
                                <button style={tabBtnStyle(activeTab === 'analysis')} onClick={() => setActiveTab('analysis')}>
                                    <BarChart3 size={14} /> Analysis
                                </button>
                                <button style={tabBtnStyle(activeTab === 'logs')} onClick={() => setActiveTab('logs')}>
                                    <FileText size={14} /> Logs
                                </button>
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-icon" onClick={() => setIsMinimized(true)} style={btnStyle}>
                                <Minimize2 size={16} />
                            </button>
                            <button className="btn btn-secondary btn-icon" onClick={onClose} style={btnStyle}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1, padding: '0.5rem', overflow: 'hidden', background: '#0f172a' }}>
                        {renderContent()}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}