import { useMemo, useState, useEffect } from 'react';
import { Server, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FactoryPC } from '../../types';

export interface PCWithVersion extends FactoryPC {
    version: string;
    line: number;
}

interface Props {
    pcs: PCWithVersion[];
    onSelectPC: (pc: PCWithVersion) => void;
    loading: boolean;
}

export default function PCSelectionList({ pcs, onSelectPC, loading }: Props) {
    // Group Data: Version -> Line -> PCs[]
    const groupedPCs = useMemo(() => {
        return pcs.reduce((acc: Record<string, Record<number, PCWithVersion[]>>, pc) => {
            if (!acc[pc.version]) acc[pc.version] = {};
            if (!acc[pc.version][pc.line]) acc[pc.version][pc.line] = [];
            acc[pc.version][pc.line].push(pc);
            return acc;
        }, {});
    }, [pcs]);

    const versions = useMemo(() => Object.keys(groupedPCs).sort(), [groupedPCs]);

    const [activeTab, setActiveTab] = useState<string>('');

    // Set initial tab to the first version (3.5)
    useEffect(() => {
        if (versions.length > 0 && !activeTab) {
            setActiveTab(versions[0]);
        }
    }, [versions, activeTab]);

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const currentLines = activeTab && groupedPCs[activeTab] ? groupedPCs[activeTab] : {};

    return (
        <div className="card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>

            {/* --- Header & Tabs --- */}
            <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
                <div style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Server size={14} color="#3b82f6" />
                        Select PC
                    </h2>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-main)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        {versions.map(ver => (
                            <button
                                key={ver}
                                onClick={() => setActiveTab(ver)}
                                style={{
                                    border: 'none',
                                    background: activeTab === ver ? '#3b82f6' : 'transparent',
                                    color: activeTab === ver ? '#fff' : 'var(--text-dim)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                v{ver}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Scrollable Content --- */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        {Object.entries(currentLines).map(([lineStr, linePCs]) => (
                            <div key={lineStr} style={{ marginBottom: '0.75rem' }}>

                                {/* Line Divider */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0 0.25rem',
                                    marginBottom: '0.5rem',
                                    color: 'var(--text-dim)',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase'
                                }}>
                                    <Activity size={10} />
                                    Line {lineStr}
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                </div>

                                {/* Square Grid */}
                                <div style={{
                                    display: 'grid',
                                    // Adjust 80px to control minimum square size
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                                    gap: '0.5rem'
                                }}>
                                    {linePCs.map((pc) => (
                                        <motion.div
                                            key={pc.pcId}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onSelectPC(pc)}
                                            style={{
                                                aspectRatio: '1', // Forces perfect square
                                                background: 'var(--bg-main)',
                                                border: `1px solid ${pc.isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {/* Status Dot */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '6px',
                                                right: '6px',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: pc.isOnline ? '#10b981' : '#ef4444',
                                                boxShadow: pc.isOnline ? '0 0 4px #10b981' : 'none'
                                            }} />

                                            {/* IP Address */}
                                            <div style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: 'var(--text-main)',
                                                textAlign: 'center',
                                                lineHeight: 1.2
                                            }}>
                                                {pc.ipAddress}
                                            </div>

                                            <div style={{
                                                fontSize: '0.6rem',
                                                color: pc.isOnline ? '#10b981' : '#ef4444',
                                                marginTop: '4px',
                                                fontWeight: 500
                                            }}>
                                                PC-{pc.pcNumber}
                                            </div>

                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {Object.keys(currentLines).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.8rem' }}>
                                No PCs on v{activeTab}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}