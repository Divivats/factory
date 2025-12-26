// PC Selector Component
// Location: src/components/LogAnalyzer/PCSelector.tsx

import { useEffect, useState } from 'react';
import { Monitor, ChevronDown } from 'lucide-react';
import { factoryApi } from '../../services/api';
import type { FactoryPC } from '../../types';

interface Props {
    selectedPC: number | null;
    onSelectPC: (pcId: number) => void;
}

export default function PCSelector({ selectedPC, onSelectPC }: Props) {
    const [pcs, setPCs] = useState<FactoryPC[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadPCs();
    }, []);

    const loadPCs = async () => {
        try {
            const data = await factoryApi.getPCs();
            const allPCs = data.lines.flatMap(line => line.pcs);
            setPCs(allPCs);
        } catch (error) {
            console.error('Failed to load PCs:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedPCData = pcs.find(pc => pc.pcId === selectedPC);

    return (
        <div style={{ position: 'relative', width: '300px' }}>
            <button
                className="btn btn-secondary"
                style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Monitor size={18} />
                    <span>
                        {selectedPCData
                            ? `Line ${selectedPCData.lineNumber} - PC ${selectedPCData.pcNumber}`
                            : 'Select PC...'}
                    </span>
                </div>
                <ChevronDown size={18} />
            </button>

            {isOpen && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            maxHeight: '400px',
                            overflowY: 'auto',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            zIndex: 1000,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                        }}
                    >
                        {loading ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                Loading PCs...
                            </div>
                        ) : (
                            pcs.map(pc => (
                                <button
                                    key={pc.pcId}
                                    className="btn btn-ghost"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 0,
                                        background: pc.pcId === selectedPC ? 'var(--primary-dim)' : 'transparent'
                                    }}
                                    onClick={() => {
                                        onSelectPC(pc.pcId);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                                        <div
                                            className="pulse"
                                            style={{
                                                background: pc.isOnline ? 'var(--success)' : 'var(--danger)'
                                            }}
                                        />
                                        <span style={{ flex: 1, textAlign: 'left' }}>
                                            Line {pc.lineNumber} - PC {pc.pcNumber}
                                        </span>
                                        <span
                                            className="text-mono"
                                            style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}
                                        >
                                            {pc.ipAddress}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}