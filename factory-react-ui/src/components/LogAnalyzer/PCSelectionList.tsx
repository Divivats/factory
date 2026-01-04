import { useMemo } from 'react';
import { Monitor, ChevronRight, Box, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
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
    const groupedPCs = useMemo(() => {
        return pcs.reduce((acc: Record<string, Record<number, PCWithVersion[]>>, pc) => {
            if (!acc[pc.version]) acc[pc.version] = {};
            if (!acc[pc.version][pc.line]) acc[pc.version][pc.line] = [];
            acc[pc.version][pc.line].push(pc);
            return acc;
        }, {});
    }, [pcs]);

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}
            >
                <div
                    style={{
                        display: 'inline-block',
                        width: '40px',
                        height: '40px',
                        border: '4px solid var(--border)',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '1rem'
                    }}
                />
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading PCs...</p>

                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </motion.div>
        );
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
            {/* Header */}
            <div
                style={{
                    padding: '1.5rem',
                    borderBottom: '2px solid var(--border)',
                    background: 'linear-gradient(135deg, var(--bg-panel), var(--bg-card))'
                }}
            >
                <h2
                    style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#60a5fa',
                        margin: 0,
                        marginBottom: '0.5rem'
                    }}
                >
                    Select PC to Analyze Logs
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
                    Choose a PC to view and analyze its log files
                </p>
            </div>

            {/* List */}
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {Object.entries(groupedPCs).map(([version, lines], versionIndex) => (
                    <motion.div
                        key={version}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: versionIndex * 0.1 }}
                    >
                        {/* Version Header */}
                        <div
                            style={{
                                padding: '1rem 1.5rem',
                                background: 'linear-gradient(90deg, rgba(59,130,246,0.15), transparent)',
                                borderBottom: '1px solid var(--border)',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                backdropFilter: 'blur(12px)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Box size={18} color="#3b82f6" />
                                <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                                    Version {version}
                                </span>
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                    {Object.values(lines).flat().length} PCs
                                </span>
                            </div>
                        </div>

                        {/* Lines */}
                        {Object.entries(lines).map(([line, linePCs]) => (
                            <div key={line}>
                                {/* Line Header */}
                                <div
                                    style={{
                                        padding: '0.75rem 1.5rem 0.75rem 3rem',
                                        background: 'var(--bg-hover)',
                                        borderBottom: '1px solid var(--border)',
                                        position: 'sticky',
                                        top: 52,
                                        zIndex: 9
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Activity size={16} color="var(--success)" />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                            Line {line}
                                        </span>
                                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                                            {linePCs.length} PCs
                                        </span>
                                    </div>
                                </div>

                                {/* PCs */}
                                {linePCs.map((pc, index) => (
                                    <motion.div
                                        key={pc.pcId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onSelectPC(pc)}
                                        style={{
                                            padding: '1rem 1.5rem 1rem 5rem',
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background =
                                                'rgba(59, 130, 246, 0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Monitor size={20} color="#3b82f6" />
                                            <div>
                                                <div style={{ fontWeight: 700 }}>
                                                    PC-{pc.pcNumber}
                                                </div>
                                                <div
                                                    className="text-mono"
                                                    style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}
                                                >
                                                    {pc.ipAddress}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span
                                                className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'
                                                    }`}
                                            >
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: 'currentColor',
                                                        marginRight: '0.5rem',
                                                        animation: pc.isOnline
                                                            ? 'pulse 2s infinite'
                                                            : 'none'
                                                    }}
                                                />
                                                {pc.isOnline ? 'Online' : 'Offline'}
                                            </span>
                                            <ChevronRight size={18} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ))}
                    </motion.div>
                ))}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
