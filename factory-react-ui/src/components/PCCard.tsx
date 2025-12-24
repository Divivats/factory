import { Monitor, Wifi, WifiOff, Play, Square, Cpu } from 'lucide-react'
import type { FactoryPC } from '../types'

interface Props {
    pc: FactoryPC
    onClick: (pc: FactoryPC) => void
}

export default function PCCard({ pc, onClick }: Props) {
    const getStatusColor = () => {
        if (!pc.isOnline) return 'var(--danger)'
        return pc.isApplicationRunning ? 'var(--success)' : 'var(--warning)'
    }

    return (
        <div
            className="card"
            onClick={() => onClick(pc)}
            style={{ borderLeft: `3px solid ${getStatusColor()}` }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <Cpu size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>PC-{pc.pcNumber}</h3>
                    </div>
                    <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>{pc.ipAddress}</div>
                </div>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: pc.isOnline ? 'var(--success-bg)' : 'var(--danger-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Monitor size={16} color={pc.isOnline ? 'var(--success)' : 'var(--danger)'} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {pc.isOnline ? <Wifi size={9} strokeWidth={2.5} /> : <WifiOff size={9} strokeWidth={2.5} />}
                    <span>{pc.isOnline ? 'Online' : 'Offline'}</span>
                </span>
                <span className={`badge ${pc.isApplicationRunning ? 'badge-success' : 'badge-neutral'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {pc.isApplicationRunning ? <Play size={8} strokeWidth={3} fill="currentColor" /> : <Square size={8} strokeWidth={2.5} />}
                    <span>{pc.isApplicationRunning ? 'Active' : 'Idle'}</span>
                </span>
            </div>

            <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '0.5rem',
                background: 'linear-gradient(to bottom, transparent, var(--bg-hover))',
                marginLeft: '-0.75rem',
                marginRight: '-0.75rem',
                marginBottom: '-0.75rem',
                padding: '0.5rem 0.75rem 0.625rem'
            }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Current Model
                </div>
                <div className="text-mono" style={{
                    color: 'var(--text-main)',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500
                }}>
                    {pc.currentModel?.modelName || 'No model loaded'}
                </div>
            </div>
        </div>
    )
}
