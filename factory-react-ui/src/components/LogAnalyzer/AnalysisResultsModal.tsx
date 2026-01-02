import { useState } from 'react';
import { X, BarChart3, Minimize2 } from 'lucide-react';
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

export default function AnalysisResultsModal({
    result,
    selectedBarrel,
    onBarrelClick,
    onClose
}: Props) {
    const [isMinimized, setIsMinimized] = useState(false);
    const selectedBarrelData = selectedBarrel ? result.barrels.find(b => b.barrelId === selectedBarrel) : null;

    return (
        <AnimatePresence>
            {isMinimized ? (
                <motion.button
                    layoutId="analysis-window"
                    onClick={() => setIsMinimized(false)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: 'linear' }}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        // CHANGED: Matte Royal Blue instead of Neon Gradient
                        background: '#3b82f6',
                        // CHANGED: Softer border
                        border: '1px solid #2563eb',
                        borderRadius: '12px',
                        padding: '1rem 1.5rem',
                        cursor: 'pointer',
                        zIndex: 1000,
                        // CHANGED: Removed colored glow, used standard shadow
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
                    {/* Header */}
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
                            {/* CHANGED: Softer Icon Color */}
                            <BarChart3 size={24} color="#60a5fa" />
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                                    Log Analysis Results
                                </h2>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                                    {result.barrels.length} barrels analyzed
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

                    {/* ... Rest of the component (Charts) remains the same ... */}
                    {/* Command Center Layout - Split Pane */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem',
                        overflow: 'hidden'
                    }}>
                        {/* Left: Barrel Execution Chart - 40% */}
                        <div style={{
                            width: '40%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}>
                            <div className="card" style={{
                                padding: '1.5rem',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h3 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    // CHANGED: Softer primary color
                                    color: '#60a5fa',
                                    marginBottom: '1rem',
                                    flexShrink: 0
                                }}>
                                    Barrel Execution Times
                                </h3>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <BarrelExecutionChart
                                        barrels={result.barrels}
                                        selectedBarrel={selectedBarrel}
                                        onBarrelClick={onBarrelClick}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right: Gantt Chart - 60% */}
                        <div style={{
                            width: '60%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}>
                            {selectedBarrel && selectedBarrelData ? (
                                <div className="card" style={{
                                    padding: '1.5rem',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    // CHANGED: Softer border
                                    border: '1px solid #3b82f6'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1rem',
                                        flexShrink: 0
                                    }}>
                                        <div>
                                            <h3 style={{
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                // CHANGED: Softer primary color
                                                color: '#60a5fa',
                                                marginBottom: '0.5rem'
                                            }}>
                                                Operation Timeline - Barrel (Actual vs Ideal) {selectedBarrel}
                                            </h3>
                                            <div className="text-mono" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                                {selectedBarrelData.operations.length} operations • Total: {selectedBarrelData.totalExecutionTime}ms
                                            </div>
                                        </div>
                                        <button className="btn btn-secondary" onClick={() => onBarrelClick('')}>
                                            Close Timeline
                                        </button>
                                    </div>

                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        <OperationGanttChart
                                            operations={selectedBarrelData.operations}
                                            barrelId={selectedBarrel}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="card" style={{
                                    padding: '3rem',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--bg-panel)'
                                }}>
                                    <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                                        <BarChart3 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                            Select a barrel to view operation timeline
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}