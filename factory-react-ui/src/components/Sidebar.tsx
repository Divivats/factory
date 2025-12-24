import { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Server, Package, Activity, ChevronDown, ChevronRight, ChevronLeft, Loader2, ScrollText } from 'lucide-react'
import { factoryApi } from '../services/api'

export default function Sidebar() {
    const location = useLocation()
    const { version: activeVersion } = useParams()
    const [searchParams] = useSearchParams()
    const activeLine = searchParams.get('line')

    // Data State
    const [versions, setVersions] = useState<string[]>([])
    const [versionLines, setVersionLines] = useState<Record<string, number[]>>({})
    const [loading, setLoading] = useState(true)
    const [loadingLines, setLoadingLines] = useState<string | null>(null)

    // UI State
    const [collapsed, setCollapsed] = useState(false)
    const [allVersionsOpen, setAllVersionsOpen] = useState(false)
    const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadVersions()
    }, [])

    // Auto-expand and load lines if landing directly on a specific version url
    useEffect(() => {
        if (activeVersion && !collapsed) {
            setAllVersionsOpen(true)
            setExpandedVersions(prev => new Set(prev).add(activeVersion))
            if (!versionLines[activeVersion]) {
                fetchLinesForVersion(activeVersion)
            }
        }
    }, [activeVersion, collapsed])

    const loadVersions = async () => {
        try {
            const versionsData = await factoryApi.getVersions()
            setVersions(versionsData)
        } catch (error) {
            console.error('Failed to load versions:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchLinesForVersion = async (version: string) => {
        if (versionLines[version]) return

        try {
            setLoadingLines(version)
            const data = await factoryApi.getPCs(version)
            const lines = data.lines.map(l => l.lineNumber).sort((a, b) => a - b)

            setVersionLines(prev => ({
                ...prev,
                [version]: lines
            }))
        } catch (error) {
            console.error(`Failed to load lines for version ${version}:`, error)
        } finally {
            setLoadingLines(null)
        }
    }

    const toggleVersion = async (v: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const newSet = new Set(expandedVersions)
        if (newSet.has(v)) {
            newSet.delete(v)
        } else {
            newSet.add(v)
            if (!versionLines[v]) {
                await fetchLinesForVersion(v)
            }
        }
        setExpandedVersions(newSet)
    }

    const toggleAllVersions = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setAllVersionsOpen(!allVersionsOpen)
    }

    const isActive = (path: string) => location.pathname.startsWith(path)

    const isVersionActive = (v: string) => activeVersion === v && !activeLine

    const isLineActive = (v: string, l: number) => activeVersion === v && activeLine === l.toString()

    const isAllVersionsActive = !activeVersion && location.pathname === '/dashboard'

    return (
        <aside
            className="factory-sidebar"
            style={{
                width: collapsed ? '80px' : '280px',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                padding: collapsed ? '1.5rem 0.5rem' : '1.5rem',
                height: '100%',
                overflowY: 'auto',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
            }}
        >
            <div className="sidebar-header" style={{
                display: 'flex',
                justifyContent: collapsed ? 'center' : 'space-between',
                alignItems: 'center',
                paddingRight: 0,
                marginBottom: '2rem'
            }}>
                {!collapsed ? (
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <Server size={20} strokeWidth={2.5} />
                        </div>
                        <span>Factory Monitoring System</span>
                    </div>
                ) : (
                    <div className="sidebar-logo-icon">
                        <Server size={20} strokeWidth={2.5} />
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--neutral-500)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: collapsed ? '1rem' : 0
                    }}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1 }}>
                {/* Dashboards Section */}
                <div className="sidebar-section">
                    {!collapsed && <div className="sidebar-section-title">Dashboards</div>}
                    <ul className="sidebar-list">
                        <li className="sidebar-item">
                            <div
                                className={`sidebar-link ${isAllVersionsActive && !collapsed ? 'active' : ''}`}
                                style={{
                                    cursor: 'default',
                                    display: 'flex',
                                    justifyContent: collapsed ? 'center' : 'space-between',
                                    alignItems: 'center',
                                    padding: 0,
                                    overflow: 'hidden'
                                }}
                            >
                                <Link
                                    to="/dashboard"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        color: 'inherit',
                                        textDecoration: 'none',
                                        flex: 1,
                                        padding: '0.75rem'
                                    }}
                                >
                                    <Activity className="sidebar-link-icon" size={18} />
                                    {!collapsed && <span>All Versions</span>}
                                </Link>

                                {!collapsed && (
                                    <button
                                        onClick={toggleAllVersions}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'inherit',
                                            cursor: 'pointer',
                                            padding: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            borderLeft: '1px solid rgba(255,255,255,0.05)'
                                        }}
                                    >
                                        {allVersionsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                )}
                            </div>

                            {!collapsed && allVersionsOpen && (
                                <ul style={{ listStyle: 'none', paddingLeft: '0.5rem', marginTop: '0.25rem' }}>
                                    {loading ? (
                                        <li className="sidebar-item"><div className="sidebar-link text-muted" style={{ paddingLeft: '2.5rem' }}>Loading...</div></li>
                                    ) : (
                                        versions.map((version) => (
                                            <li key={version} className="sidebar-item">
                                                <div
                                                    className={`sidebar-link ${isVersionActive(version) ? 'active' : ''}`}
                                                    style={{
                                                        padding: 0,
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        color: activeVersion === version ? 'white' : 'var(--neutral-400)'
                                                    }}
                                                >
                                                    <Link
                                                        to={`/dashboard/${version}`}
                                                        style={{
                                                            color: 'inherit',
                                                            textDecoration: 'none',
                                                            flex: 1,
                                                            fontSize: '0.9rem',
                                                            padding: '0.5rem 0.5rem 0.5rem 2.5rem'
                                                        }}
                                                    >
                                                        Version {version}
                                                    </Link>

                                                    <button
                                                        onClick={(e) => toggleVersion(version, e)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'inherit',
                                                            cursor: 'pointer',
                                                            padding: '0.5rem 0.75rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            borderLeft: '1px solid rgba(255,255,255,0.05)'
                                                        }}
                                                    >
                                                        {loadingLines === version ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            expandedVersions.has(version) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                                        )}
                                                    </button>
                                                </div>

                                                {expandedVersions.has(version) && (
                                                    <ul style={{
                                                        listStyle: 'none',
                                                        paddingLeft: '1rem',
                                                        borderLeft: '1px solid var(--neutral-700)',
                                                        marginLeft: '1.5rem',
                                                        marginTop: '0.25rem',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        {!versionLines[version] && !loadingLines && (
                                                            <li className="sidebar-item"><div style={{ fontSize: '0.8rem', paddingLeft: '0.75rem', color: 'var(--neutral-500)' }}>No lines found</div></li>
                                                        )}

                                                        {versionLines[version]?.map((line) => (
                                                            <li key={`${version}-${line}`} className="sidebar-item">
                                                                <Link
                                                                    to={`/dashboard/${version}?line=${line}`}
                                                                    className={`sidebar-link ${isLineActive(version, line) ? 'active' : ''}`}
                                                                    style={{
                                                                        padding: '0.4rem 0.75rem',
                                                                        fontSize: '0.85rem',
                                                                        height: 'auto',
                                                                        color: isLineActive(version, line) ? 'white' : 'var(--neutral-500)'
                                                                    }}
                                                                >
                                                                    Line {line}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </li>
                    </ul>
                </div>

                {/* Management Section */}
                <div className="sidebar-section">
                    {!collapsed && <div className="sidebar-section-title">Management</div>}
                    <ul className="sidebar-list">
                        {/* Model Library */}
                        <li className="sidebar-item">
                            <Link
                                to="/models"
                                className={`sidebar-link ${isActive('/models') ? 'active' : ''}`}
                                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                            >
                                <Package className="sidebar-link-icon" size={18} />
                                {!collapsed && <span>Model Management</span>}
                            </Link>
                        </li>

                        {/* NEW: Log Analyzer */}
                        <li className="sidebar-item">
                            <Link
                                to="/logs"
                                className={`sidebar-link ${isActive('/logs') ? 'active' : ''}`}
                                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                            >
                                <ScrollText className="sidebar-link-icon" size={18} />
                                {!collapsed && <span>Log Analyzer</span>}
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            
        </aside>
    )
}