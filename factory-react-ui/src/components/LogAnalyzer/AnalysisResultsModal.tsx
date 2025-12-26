// Analysis Results Modal
// Location: src/components/LogAnalyzer/AnalysisResultsModal.tsx

import { X, Info } from 'lucide-react';
import { useState } from 'react';
import BarrelExecutionChart from './BarrelExecutionChart';
import OperationGanttChart from './OperationGanttChart';
import type { AnalysisResult } from '../../types/logTypes';

interface Props {
    result: AnalysisResult;
    onClose: () => void;
}

export default function AnalysisResultsModal({ result, onClose }: Props) {
    const [selectedBarrel, setSelectedBarrel] = useState<string | null>(null);

    const selectedBarrelData = selectedBarrel
        ? result.barrels.find(b => b.barrelId === selectedBarrel)
        : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: '1400px', maxHeight: '95vh', height: '95vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                            Log Analysis Results
                        </h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {result.summary.totalBarrels} barrels analyzed
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-secondary btn-icon">
                        <X size={20} />
                    </button>
                </div>

                {/* Summary Stats */}
                <div
                    style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1rem'
                    }}
                >
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.25rem' }}>
                            TOTAL BARRELS
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {result.summary.totalBarrels}
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.25rem' }}>
                            AVERAGE TIME
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                            {result.summary.averageExecutionTime.toFixed(0)}ms
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.25rem' }}>
                            MIN TIME
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {result.summary.minExecutionTime.toFixed(0)}ms
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.25rem' }}>
                            MAX TIME
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                            {result.summary.maxExecutionTime.toFixed(0)}ms
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div
                    className="modal-body"
                    style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        overflow: 'auto',
                        flex: 1
                    }}
                >
                    {/* Bar Chart */}
                    <div className="card" style={{ padding: '1.5rem', height: selectedBarrel ? '400px' : '600px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                                Barrel Execution Times
                            </h3>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.25rem 0.75rem',
                                    background: 'var(--bg-hover)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-dim)'
                                }}
                            >
                                <Info size={14} />
                                Click a bar to view operation details
                            </div>
                        </div>
                        <div style={{ height: 'calc(100% - 50px)' }}>
                            <BarrelExecutionChart
                                barrels={result.barrels}
                                selectedBarrel={selectedBarrel}
                                onBarrelClick={setSelectedBarrel}
                            />
                        </div>
                    </div>

                    {/* Gantt Chart (appears when barrel is selected) */}
                    {selectedBarrel && selectedBarrelData && (
                        <div className="card" style={{ padding: '1.5rem', height: '500px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                                    Operation Timeline - Barrel {selectedBarrel}
                                </h3>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedBarrel(null)}
                                    style={{ fontSize: '0.85rem' }}
                                >
                                    Close Timeline
                                </button>
                            </div>
                            <div style={{ height: 'calc(100% - 50px)' }}>
                                <OperationGanttChart
                                    operations={selectedBarrelData.operations}
                                    barrelId={selectedBarrel}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}