import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { LayoutGrid, List, Activity, Monitor, Filter } from 'lucide-react'
import { factoryApi } from '../services/api'
import PCCard from '../components/PCCard'
import PCDetailsModal from '../components/PCDetailsModal'
import type { LineGroup, Stats, FactoryPC } from '../types'

export default function Dashboard() {
    const { version } = useParams()
    const [searchParams] = useSearchParams()
    const lineParam = searchParams.get('line')

    const [data, setData] = useState<{ total: number; online: number; offline: number; lines: LineGroup[] } | null>(null)
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
    const [loading, setLoading] = useState(true)
    const [selectedPC, setSelectedPC] = useState<FactoryPC | null>(null)
    const mounted = useRef(true)

    useEffect(() => {
        mounted.current = true
        loadData(true)
        const interval = setInterval(() => loadData(false), 5000)
        return () => { mounted.current = false; clearInterval(interval) }
    }, [version, lineParam]) // Re-fetch when version or line changes

    const loadData = async (isInitial: boolean) => {
        if (isInitial) setLoading(true)
        try {
            // Pass the specific line filter if present
            const targetLine = lineParam ? parseInt(lineParam) : undefined
            const res = await factoryApi.getPCs(version, targetLine)

            if (mounted.current) setData(res)
        } catch (err) {
            console.error(err)
        } finally {
            if (isInitial && mounted.current) setLoading(false)
        }
    }

    if (loading && !data) return <div className="main-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '10rem' }}>Loading...</div>

    // Dynamic Header Text
    const getHeaderText = () => {
        if (version && lineParam) return `Version ${version} • Line ${lineParam}`
        if (version) return `Version ${version}`
        return 'Factory Floor Overview'
    }

    return (
        <div className="main-content">
            {/* Dashboard Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {getHeaderText()}
                        {lineParam && <span className="badge badge-neutral"><Filter size={12} /> Filtered</span>}
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--success)' }}>● {data?.online || 0} Online</span>
                        <span style={{ color: 'var(--danger)' }}>● {data?.offline || 0} Offline</span>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <button
                        className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '0.4rem', background: viewMode === 'cards' ? 'var(--primary)' : 'transparent', color: viewMode === 'cards' ? 'black' : 'var(--text-muted)' }}
                        onClick={() => setViewMode('cards')}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '0.4rem', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? 'black' : 'var(--text-muted)' }}
                        onClick={() => setViewMode('list')}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {data?.lines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                    <Activity size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3>No units found</h3>
                    <p>There are no active PCs for this selection.</p>
                </div>
            ) : (
                data?.lines.map(line => (
                    <div key={line.lineNumber} style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Line {line.lineNumber}</h2>
                            <span className="badge badge-neutral">{line.pcs.length} PCs</span>
                        </div>

                        {viewMode === 'cards' ? (
                            <div className="pc-grid">
                                {line.pcs.map(pc => <PCCard key={pc.pcId} pc={pc} onClick={setSelectedPC} />)}
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Unit</th>
                                            <th>IP Address</th>
                                            <th>Status</th>
                                            <th>Application</th>
                                            <th>Current Model</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {line.pcs.map(pc => (
                                            <tr key={pc.pcId} onClick={() => setSelectedPC(pc)}>
                                                <td style={{ fontWeight: 600 }}>PC-{pc.pcNumber}</td>
                                                <td className="text-mono" style={{ color: 'var(--text-dim)' }}>{pc.ipAddress}</td>
                                                <td>
                                                    <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'}`}>
                                                        {pc.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td>{pc.isApplicationRunning ? 'Running' : 'Stopped'}</td>
                                                <td className="text-mono">{pc.currentModel?.modelName || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))
            )}

            {selectedPC && <PCDetailsModal pcSummary={selectedPC} onClose={() => setSelectedPC(null)} />}
        </div>
    )
}