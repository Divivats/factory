import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LayoutGrid, List, TrendingUp, Server } from 'lucide-react'
import { factoryApi } from '../services/api'
import PCCard from '../components/PCCard'
import type { LineGroup, Stats } from '../types'

export default function Dashboard() {
  const { version } = useParams()
  const [data, setData] = useState<{ total: number; online: number; offline: number; lines: LineGroup[] } | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    loadStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData()
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [version])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await factoryApi.getPCs(version)
      setData(result)
    } catch (err) {
      console.error('Failed to load PCs:', err)
      setError('Failed to load PC data')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await factoryApi.getStats()
      setStats(result)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  if (loading && !data) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', color: 'var(--neutral-400)' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Loading...</div>
          <div style={{ fontSize: '0.875rem' }}>Fetching factory data</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <div className="main-header">
          <div className="header-title-section">
            <h1 className="header-title">Connection Error</h1>
            <p className="header-subtitle">Unable to connect to backend</p>
          </div>
        </div>
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{
            textAlign: 'center',
            background: 'var(--neutral-800)',
            padding: 'var(--spacing-3xl)',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--danger-500)',
            maxWidth: '600px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-lg)' }}>⚠️</div>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)', fontWeight: 700, color: 'var(--danger-400)' }}>
              Backend Server Not Running
            </div>
            <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-300)', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
              {error}
            </div>
            <div style={{
              background: 'var(--neutral-700)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-xl)',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              <div style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-sm)' }}>Start the backend:</div>
              <div style={{ color: 'var(--primary-300)' }}>cd FactoryMonitoringWeb</div>
              <div style={{ color: 'var(--primary-300)' }}>dotnet run</div>
              <div style={{ color: 'var(--neutral-500)', marginTop: 'var(--spacing-sm)', fontSize: '0.75rem' }}>
                Expected: http://localhost:5000
              </div>
            </div>
            <button
              onClick={loadData}
              className="btn btn-primary"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="main-header">
        <div className="header-title-section">
          <h1 className="header-title">
            {version ? `Version ${version}` : 'All Factory PCs'}
          </h1>
          <p className="header-subtitle">
            {data?.total || 0} PCs • {data?.online || 0} Online • {data?.offline || 0} Offline
          </p>
        </div>
        <div className="header-actions">
          {stats && (
            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginRight: 'var(--spacing-lg)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-500)' }}>
                  {stats.onlinePCs}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>Online</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning-500)' }}>
                  {stats.runningApps}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>Running</div>
              </div>
            </div>
          )}
          <div className="view-toggle">
            <button
              className={`btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid size={16} />
              Cards
            </button>
            <button
              className={`btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="main-content">
        {!data?.lines || data.lines.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-3xl)',
            background: 'var(--neutral-800)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--neutral-700)'
          }}>
            <Server size={64} color="var(--neutral-600)" strokeWidth={1.5} style={{ margin: '0 auto var(--spacing-lg)' }} />
            <h2 style={{ color: 'var(--neutral-300)', marginBottom: 'var(--spacing-sm)' }}>
              No PCs Found
            </h2>
            <p style={{ color: 'var(--neutral-500)' }}>
              {version
                ? `No PCs registered with version ${version}`
                : 'No PCs have been registered yet'}
            </p>
          </div>
        ) : (
          data.lines.map((line) => (
            <div key={line.lineNumber} className="line-group">
              <div className="line-header">
                <div>
                  <h2 className="line-title">Line {line.lineNumber}</h2>
                  <div className="line-count">
                    {line.pcs.length} PC{line.pcs.length !== 1 ? 's' : ''} •{' '}
                    {line.pcs.filter(pc => pc.isOnline).length} Online
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                  <TrendingUp size={20} color="var(--success-500)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--neutral-400)' }}>
                    {Math.round((line.pcs.filter(pc => pc.isOnline).length / line.pcs.length) * 100)}% uptime
                  </span>
                </div>
              </div>

              {viewMode === 'cards' ? (
                <div className="pc-grid">
                  {line.pcs.map((pc) => (
                    <PCCard key={pc.pcId} pc={pc} />
                  ))}
                </div>
              ) : (
                <div style={{
                  background: 'var(--neutral-800)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--neutral-700)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--neutral-700)', textAlign: 'left' }}>
                        <th style={{ padding: 'var(--spacing-md)', fontWeight: 600, fontSize: '0.875rem' }}>PC</th>
                        <th style={{ padding: 'var(--spacing-md)', fontWeight: 600, fontSize: '0.875rem' }}>IP Address</th>
                        <th style={{ padding: 'var(--spacing-md)', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                        <th style={{ padding: 'var(--spacing-md)', fontWeight: 600, fontSize: '0.875rem' }}>App</th>
                        <th style={{ padding: 'var(--spacing-md)', fontWeight: 600, fontSize: '0.875rem' }}>Current Model</th>
                        <th style={{ padding: 'var(--spacing-md)', fontWeight: 600, fontSize: '0.875rem' }}>Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {line.pcs.map((pc, index) => (
                        <tr
                          key={pc.pcId}
                          onClick={() => window.location.href = `/pc/${pc.pcId}`}
                          style={{
                            borderTop: index > 0 ? '1px solid var(--neutral-700)' : 'none',
                            cursor: 'pointer',
                            transition: 'background var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-700)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>
                            PC {pc.pcNumber}
                          </td>
                          <td style={{ padding: 'var(--spacing-md)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {pc.ipAddress}
                          </td>
                          <td style={{ padding: 'var(--spacing-md)' }}>
                            <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'}`}>
                              {pc.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--spacing-md)' }}>
                            <span className={`badge ${pc.isApplicationRunning ? 'badge-success' : 'badge-neutral'}`}>
                              {pc.isApplicationRunning ? 'Running' : 'Stopped'}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--spacing-md)', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--primary-400)' }}>
                            {pc.currentModel?.modelName || 'None'}
                          </td>
                          <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem' }}>
                            {pc.modelVersion}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}

