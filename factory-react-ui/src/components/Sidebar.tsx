import { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Server, Package, LayoutGrid, Box, ChevronRight, ChevronDown, Activity, Circle } from 'lucide-react'
import { factoryApi } from '../services/api'
import type { FactoryPC } from '../types'

export default function Sidebar() {
    const location = useLocation()
    const { version: activeVersion } = useParams()
    const [searchParams] = useSearchParams()
    const activeLine = searchParams.get('line')

    // State
    const [versionMap, setVersionMap] = useState<Record<string, number[]>>({})
    const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTree()
    }, [])

    // Auto-expand the active version if we are on a version page
    useEffect(() => {
        if (activeVersion && !expandedVersions[activeVersion]) {
            setExpandedVersions(prev => ({ ...prev, [activeVersion]: true }))
        }
    }, [activeVersion])

    const loadTree = async () => {
        try {
            // We fetch all PCs to build the Version -> Lines map dynamically
            // This ensures we only show lines that actually exist for a version
            const data = await factoryApi.getPCs()

            const tree: Record<string, Set<number>> = {}

            // Iterate all lines and their PCs to build the map
            data.lines.forEach(line => {
                line.pcs.forEach(pc => {
                    if (!tree[pc.modelVersion]) {
                        tree[pc.modelVersion] = new Set()
                    }
                    tree[pc.modelVersion].add(line.lineNumber)
                })
            })

            // Convert Sets to Arrays and sort
            const finalMap: Record<string, number[]> = {}
            Object.keys(tree).sort().forEach(v => {
                finalMap[v] = Array.from(tree[v]).sort((a, b) => a - b)
            })

            setVersionMap(finalMap)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const toggleVersion = (v: string, e: React.MouseEvent) => {
        e.preventDefault()
        setExpandedVersions(prev => ({ ...prev, [v]: !prev[v] }))
    }

    const isActive = (path: string) => {
        if (path === '/dashboard' && !activeVersion && location.pathname === '/dashboard') return true
        if (path.startsWith('/models') && location.pathname.startsWith('/models')) return true
        return false
    }

    const isVersionActive = (v: string) => activeVersion === v && !activeLine

    return (
        <aside className="factory-sidebar">
            <div className="sidebar-header">
                <Link to="/dashboard" className="sidebar-logo">
                    <div style={{
                        width: 36, height: 36, background: 'var(--primary)', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'
                    }}>
                        <Server size={20} strokeWidth={3} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                        <span>FACTORY</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>MONITORING</span>
                    </div>
                </Link>
            </div>

            <nav className="sidebar-nav">
                <div style={{ marginBottom: '2rem' }}>
                    <div className="sidebar-section-title">DASHBOARD</div>
                    <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
                        <LayoutGrid size={18} />
                        <span style={{ flex: 1 }}>Overview</span>
                        {isActive('/dashboard') && <ChevronRight size={14} />}
                    </Link>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <div className="sidebar-section-title">PRODUCTION LINES</div>
                    {loading ? (
                        <div style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Loading structure...</div>
                    ) : Object.keys(versionMap).length === 0 ? (
                        <div style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>No versions found</div>
                    ) : (
                        Object.keys(versionMap).map(v => (
                            <div key={v} style={{ marginBottom: '2px' }}>
                                {/* Parent Version Item */}
                                <Link
                                    to={`/dashboard/${v}`}
                                    className={`sidebar-link ${activeVersion === v ? 'text-white' : ''}`}
                                    style={{
                                        justifyContent: 'space-between',
                                        background: activeVersion === v ? 'var(--bg-hover)' : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                                        <Box size={18} color={activeVersion === v ? 'var(--primary)' : 'currentColor'} />
                                        <span>Version {v}</span>
                                    </div>
                                    <button
                                        onClick={(e) => toggleVersion(v, e)}
                                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
                                    >
                                        {expandedVersions[v] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                </Link>

                                {/* Nested Lines Dropdown */}
                                {expandedVersions[v] && (
                                    <div style={{
                                        paddingLeft: '2.5rem',
                                        borderLeft: '1px solid var(--border)',
                                        marginLeft: '1.1rem',
                                        marginTop: '2px',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {versionMap[v].map(line => (
                                            <Link
                                                key={line}
                                                to={`/dashboard/${v}?line=${line}`}
                                                className="sidebar-link"
                                                style={{
                                                    fontSize: '0.85rem',
                                                    padding: '0.5rem 0.75rem',
                                                    background: (activeVersion === v && activeLine === line.toString()) ? 'var(--primary-dim)' : 'transparent',
                                                    color: (activeVersion === v && activeLine === line.toString()) ? 'var(--primary)' : 'var(--text-muted)'
                                                }}
                                            >
                                                <Activity size={14} />
                                                <span>Line {line}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <div className="sidebar-section-title">SYSTEM</div>
                    <Link to="/models" className={`sidebar-link ${isActive('/models') ? 'active' : ''}`}>
                        <Package size={18} />
                        <span>Model Library</span>
                    </Link>
                </div>
            </nav>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div className="badge badge-success" style={{ width: '100%', justifyContent: 'center' }}>
                    <span className="pulse"></span> System Online
                </div>
            </div>
        </aside>
    )
}