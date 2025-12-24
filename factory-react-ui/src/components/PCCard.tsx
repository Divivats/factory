import { Monitor, Wifi, WifiOff, Play, Square } from 'lucide-react'
import type { FactoryPC } from '../types'

interface Props {
    pc: FactoryPC
    onClick: (pc: FactoryPC) => void
}

export default function PCCard({ pc, onClick }: Props) {
    return (
        <div
            className="card card-hover"
            onClick={() => onClick(pc)}
            style={{ borderLeft: `4px solid ${pc.isOnline ? 'var(--success)' : 'var(--danger)'}` }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>PC-{pc.pcNumber}</h3>
                    <div className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{pc.ipAddress}</div>
                </div>
                <Monitor size={24} color={pc.isOnline ? 'var(--primary)' : 'var(--text-dim)'} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'}`}>
                    {pc.isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {pc.isOnline ? 'Online' : 'Offline'}
                </span>
                <span className={`badge ${pc.isApplicationRunning ? 'badge-success' : 'badge-neutral'}`}>
                    {pc.isApplicationRunning ? <Play size={12} /> : <Square size={12} />}
                    {pc.isApplicationRunning ? 'Running' : 'Stopped'}
                </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.8rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Current Model
                </div>
                <div className="text-mono" style={{ color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pc.currentModel?.modelName || 'No model loaded'}
                </div>
            </div>
        </div>
    )
}