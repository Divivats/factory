import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { LayoutGrid, List, Activity, Filter, ChevronRight, Zap, FileCode, AlertCircle, X } from 'lucide-react'
import { factoryApi } from '../services/api'
import { eventBus, EVENTS } from '../utils/eventBus'
import PCCard from '../components/PCCard'
import PCDetailsModal from '../components/PCDetailsModal'
import LineModelManagerModal from '../components/LineModelManagerModal'
import type { LineGroup, FactoryPC } from '../types'

export default function Dashboard() {
    const { version } = useParams()
    const [searchParams] = useSearchParams()
    const lineParam = searchParams.get('line')

    const [data, setData] = useState<{ total: number; online: number; offline: number; lines: LineGroup[] } | null>(null)
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
    const [loading, setLoading] = useState(true)
    const [selectedPC, setSelectedPC] = useState<FactoryPC | null>(null)
    const [managingLine, setManagingLine] = useState<number | null>(null)
    const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>({})
    const [showComplianceModal, setShowComplianceModal] = useState<{ lineNumber: number, nonCompliantPCs: FactoryPC[] } | null>(null)
    const mounted = useRef(true)

    useEffect(() => {
        mounted.current = true
        loadData(true)

        // Standard 5-second polling
        const interval = setInterval(() => loadData(false), 5000)
        return () => { mounted.current = false; clearInterval(interval) }
    }, [version, lineParam])

    // Listen for Model Library deployment completions
    useEffect(() => {
        const handleRefresh = () => loadData(false)
        eventBus.on(EVENTS.REFRESH_DASHBOARD, handleRefresh)
        return () => eventBus.off(EVENTS.REFRESH_DASHBOARD, handleRefresh)
    }, [])

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

    // Calculate model compliance for a line
    const getLineModelCompliance = (line: LineGroup) => {
        if (!line.pcs || line.pcs.length === 0) {
            return { expectedModel: null, compliantCount: 0, totalCount: 0, nonCompliantPCs: [] }
        }

        // Use the target model from the API (the intended model for the line)
        const expectedModel = line.targetModelName || null

        // If no target model is set, we can't determine compliance
        if (!expectedModel) {
            return { expectedModel: null, compliantCount: 0, totalCount: 0, nonCompliantPCs: [] }
        }

        // Count compliant PCs and find non-compliant ones
        const compliantPCs = line.pcs.filter(pc => pc.currentModel?.modelName === expectedModel)
        const nonCompliantPCs = line.pcs.filter(pc => pc.currentModel?.modelName !== expectedModel)

        return {
            expectedModel,
            compliantCount: compliantPCs.length,
            totalCount: line.pcs.length,
            nonCompliantPCs
        }
    }

    const handleComplianceClick = (lineNumber: number, nonCompliantPCs: FactoryPC[]) => {
        if (nonCompliantPCs.length > 0) {
            setShowComplianceModal({ lineNumber, nonCompliantPCs })
        }
    }

    if (loading && !data) return <div className="main-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '10rem' }}>Loading...</div>

    const getHeaderText = () => {
        if (version && lineParam) return `Version ${version} • Line ${lineParam} `
        if (version) return `Version ${version} `
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
                            <div
                                className="line-header"
                                style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.75rem', cursor: 'pointer' }}
                                onClick={() => toggleLine(line.lineNumber)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.75rem' }}>
                                    <ChevronRight
                                        size={16}
                                        className={`line-collapse-icon ${expandedLines[line.lineNumber] ? 'expanded' : ''}`}
                                    />
                                    <h2 className="line-header-title">Line {line.lineNumber}</h2>

                                    {/* Enhanced Units badge */}
                                    <div style={{
                                        padding: '0.3rem 0.65rem',
                                        background: 'linear-gradient(135deg, var(--bg-hover), var(--bg-panel))',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                    }}>
                                        <span style={{
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: 'var(--primary)',
                                            flexShrink: 0
                                        }} />
                                        {line.pcs.length} Units
                                    </div>

                                    {/* Only show model info when viewing a specific version */}
                                    {version && (
                                        <>
                                            {/* Model Information */}
                                            {(() => {
                                                const compliance = getLineModelCompliance(line)
                                                if (compliance.expectedModel) {
                                                    const isFullyCompliant = compliance.compliantCount === compliance.totalCount
                                                    return (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {/* Enhanced Model name badge */}
                                                            <div style={{
                                                                padding: '0.3rem 0.65rem',
                                                                background: 'linear-gradient(135deg, var(--primary-dim), transparent)',
                                                                border: '1.5px solid var(--primary)',
                                                                borderRadius: '10px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                color: 'var(--primary)',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                boxShadow: '0 2px 6px var(--primary-dim)',
                                                                letterSpacing: '-0.01em'
                                                            }}>
                                                                <FileCode size={11} strokeWidth={2.5} />
                                                                <span className="text-mono">{compliance.expectedModel}</span>
                                                            </div>
                                                            <div
                                                                onClick={(e) => {
                                                                    if (!isFullyCompliant) {
                                                                        e.stopPropagation()
                                                                        handleComplianceClick(line.lineNumber, compliance.nonCompliantPCs)
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '0.2rem 0.5rem',
                                                                    borderRadius: '999px',
                                                                    fontSize: '0.6rem',
                                                                    background: isFullyCompliant ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                                    color: isFullyCompliant ? 'var(--success)' : 'var(--danger)',
                                                                    border: `1px solid ${isFullyCompliant ? 'var(--success)' : 'var(--danger)'}`,
                                                                    cursor: isFullyCompliant ? 'default' : 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.2rem'
                                                                }}
                                                                title={isFullyCompliant ? 'All PCs compliant' : 'Click to see non-compliant PCs'}
                                                            >
                                                                {!isFullyCompliant && <AlertCircle size={10} />}
                                                                {compliance.compliantCount}/{compliance.totalCount}
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            })()}
                                        </>
                                    )}
                                </div>

                                {/* Only show Manage Models button when viewing a specific version */}
                                {version && (
                                    <button
                                        className="btn btn-primary"
                                        style={{
                                            fontSize: '0.7rem',
                                            padding: '0.35rem 0.75rem',
                                            height: 'auto'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setManagingLine(line.lineNumber)
                                        }}
                                    >
                                        Manage Models
                                    </button>
                                )}
                            </div>

                            {/* Collapsible Line Content */}
                            <div className={`line-content ${expandedLines[line.lineNumber] ? '' : 'collapsed'}`}>
                                {viewMode === 'cards' ? (
                                    <div className="pc-grid">
                                        {line.pcs.map(pc => <PCCard key={pc.pcId} pc={pc} onClick={setSelectedPC} showVersion={!version} />)}
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
                                                            <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'} `}>
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


            {selectedPC && <PCDetailsModal pcSummary={selectedPC} onClose={() => setSelectedPC(null)} onPCDeleted={() => loadData(false)} />}
            {managingLine !== null && (
                <LineModelManagerModal
                    lineNumber={managingLine}
                    version={version}
                    onClose={() => setManagingLine(null)}
                    onOperationComplete={() => {
                        // Aggressive refresh strategy for instant model name updates
                        loadData(false) // Immediate
                        setTimeout(() => loadData(false), 500) // After 500ms
                        setTimeout(() => loadData(false), 1500) // After 1.5s (catches agent sync)
                    }}
                />
            )}
            {/* Model Compliance Modal */}
            {showComplianceModal && (
                <div className="modal-overlay" onClick={() => setShowComplianceModal(null)}>
                    <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Model Compliance - Line {showComplianceModal.lineNumber}</h3>
                            <button onClick={() => setShowComplianceModal(null)} className="btn btn-secondary btn-icon">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                The following {showComplianceModal.nonCompliantPCs.length} PC{showComplianceModal.nonCompliantPCs.length !== 1 ? 's have' : ' has'} a different or missing model:
                            </p>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>PC</th>
                                            <th>IP Address</th>
                                            <th>Status</th>
                                            <th>Current Model</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {showComplianceModal.nonCompliantPCs.map(pc => (
                                            <tr key={pc.pcId} onClick={() => {
                                                setShowComplianceModal(null)
                                                setSelectedPC(pc)
                                            }}>
                                                <td style={{ fontWeight: 600 }}>PC-{pc.pcNumber}</td>
                                                <td className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{pc.ipAddress}</td>
                                                <td>
                                                    <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'} `}>
                                                        {pc.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td className="text-mono" style={{ fontSize: '0.8rem' }}>
                                                    {pc.currentModel?.modelName || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No model</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}