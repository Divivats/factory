import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Server, Package, Activity } from 'lucide-react'
import { factoryApi } from '../services/api'

export default function Sidebar() {
  const location = useLocation()
  const { version: activeVersion } = useParams()
  const [versions, setVersions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVersions()
  }, [])

  const loadVersions = async () => {
    try {
      const data = await factoryApi.getVersions()
      setVersions(data)
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path)
  }

  return (
    <aside className="factory-sidebar">
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Server size={20} strokeWidth={2.5} />
          </div>
          <span>Factory Monitor</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {/* Versions Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Model Versions</div>
          <ul className="sidebar-list">
            <li className="sidebar-item">
              <Link
                to="/dashboard"
                className={`sidebar-link ${!activeVersion && isActive('/dashboard') ? 'active' : ''}`}
              >
                <Activity className="sidebar-link-icon" size={18} />
                <span>All Versions</span>
              </Link>
            </li>
            {loading ? (
              <li className="sidebar-item">
                <div className="sidebar-link text-muted">
                  <span>Loading...</span>
                </div>
              </li>
            ) : (
              versions.map((version) => (
                <li key={version} className="sidebar-item">
                  <Link
                    to={`/dashboard/${version}`}
                    className={`sidebar-link ${activeVersion === version ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-icon">v</span>
                    <span>Version {version}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Model Management Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Management</div>
          <ul className="sidebar-list">
            <li className="sidebar-item">
              <Link
                to="/models"
                className={`sidebar-link ${isActive('/models') ? 'active' : ''}`}
              >
                <Package className="sidebar-link-icon" size={18} />
                <span>Model Library</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div style={{
        padding: 'var(--spacing-lg)',
        borderTop: '1px solid var(--neutral-700)',
        fontSize: '0.75rem',
        color: 'var(--neutral-500)'
      }}>
        <div>Factory Monitoring v1.0</div>
        <div style={{ marginTop: '0.25rem' }}>© 2024 Industrial Solutions</div>
      </div>
    </aside>
  )
}

