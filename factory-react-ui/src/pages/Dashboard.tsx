import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { LayoutGrid, List, Activity, Filter, ChevronRight, Zap } from 'lucide-react'
import { factoryApi } from '../services/api'
import PCCard from '../components/PCCard'
import PCDetailsModal from '../components/PCDetailsModal'
import type { LineGroup, FactoryPC } from '../types'

export default function Dashboard() {
    const { version } = useParams()
    const [searchParams] = useSearchParams()
    const lineParam = searchParams.get('line')

    const [data, setData] = useState<{ total: number; online: number; offline: number; lines: LineGroup[] } | null>(null)
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
    const [loading, setLoading] = useState(true)
    const [selectedPC, setSelectedPC] = useState<FactoryPC | null>(null)
    const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>({})
    const mounted = useRef(true)

    useEffect(() => {
        mounted.current = true
        loadData(true)
        const interval = setInterval(() => loadData(false), 5000)
        return () => { mounted.current = false; clearInterval(interval) }
    }, [version, lineParam])

    useEffect(() => {
        if (data && data.lines.length > 0) {
            const initialExpanded: Record<number, boolean> = {}
            data.lines.forEach(line => {
                if (!(line.lineNumber in expandedLines)) {
                    initialExpanded[line.lineNumber] = true
                }
            })
            if (Object.keys(initialExpanded).length > 0) {
                setExpandedLines(prev => ({ ...prev, ...initialExpanded }))
            }
        }
    }, [data?.lines.length])

    const loadData = async (isInitial: boolean) => {
        if (isInitial) setLoading(true)
        try {
            const targetLine = lineParam ? parseInt(lineParam) : undefined
            const res = await factoryApi.getPCs(version, targetLine)

            if (mounted.current) setData(res)
        } catch (err) {
            console.error(err)
        } finally {
            if (isInitial && mounted.current) setLoading(false)
        }
    }

    const toggleLine = (lineNumber: number) => {
        setExpandedLines(prev => ({ ...prev, [lineNumber]: !prev[lineNumber] }))
    }

    if (loading && !data) return <div className="main-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '10rem' }}>Loading...</div>

    const getHeaderText = () => {
        if (version && lineParam) return `Version ${version} • Line ${lineParam}`
        if (version) return `Version ${version}`
        return 'All PCs'
    }

    return (
        <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Sticky Dashboard Header - Matches sidebar height */}
            <div className="dashboard-header">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                }}>
                    {/* Left side - Title and Stats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Zap size={16} className="pulse" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <span>{getHeaderText()}</span>
                            {lineParam && <span className="badge badge-neutral" style={{ fontSize: '0.6rem', padding: '0.15rem 0.35rem' }}><Filter size={8} /> Filtered</span>}
                        </h1>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>● {data?.online || 0}</span>
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>● {data?.offline || 0}</span>
                            <span style={{ color: 'var(--text-dim)' }}>• {data?.total || 0}</span>
                        </div>
                    </div>

                    {/* Right side - View toggle */}
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '0.2rem',
                        borderRadius: '5px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        gap: '0.125rem'
                    }}>
                        <button
                            className="btn"
                            style={{
                                padding: '0.375rem 0.5rem',
                                background: viewMode === 'cards' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'cards' ? '#fff' : 'var(--text-muted)',
                                borderRadius: '4px',
                                minWidth: 'auto',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            onClick={() => setViewMode('cards')}
                        >
                            <LayoutGrid size={15} />
                        </button>
                        <button
                            className="btn"
                            style={{
                                padding: '0.375rem 0.5rem',
                                background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
                                borderRadius: '4px',
                                minWidth: 'auto',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="dashboard-scroll-area">
                {data?.lines.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-dim)' }}>
                        <Activity size={40} style={{ opacity: 0.3, marginBottom: '0.875rem' }} />
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.375rem' }}>No units found</h3>
                        <p style={{ fontSize: '0.875rem' }}>There are no active PCs for this selection.</p>
                    </div>
                ) : (
                    data?.lines.map(line => (
                        <div key={line.lineNumber} className="line-section">
                            {/* Collapsible Line Header */}
                            <div className="line-header" onClick={() => toggleLine(line.lineNumber)}>
                                <ChevronRight
                                    size={16}
                                    className={`line-collapse-icon ${expandedLines[line.lineNumber] ? 'expanded' : ''}`}
                                />
                                <h2 className="line-header-title">Line {line.lineNumber}</h2>
                                <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{line.pcs.length} Units</span>
                            </div>

                            {/* Collapsible Line Content */}
                            <div className={`line-content ${expandedLines[line.lineNumber] ? '' : 'collapsed'}`}>
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
                                                        <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>PC-{pc.pcNumber}</td>
                                                        <td className="text-mono" style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{pc.ipAddress}</td>
                                                        <td>
                                                            <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'}`}>
                                                                {pc.isOnline ? 'Online' : 'Offline'}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>{pc.isApplicationRunning ? 'Running' : 'Stopped'}</td>
                                                        <td className="text-mono" style={{ fontSize: '0.8rem' }}>{pc.currentModel?.modelName || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedPC && <PCDetailsModal pcSummary={selectedPC} onClose={() => setSelectedPC(null)} />}
        </div>
    )
}