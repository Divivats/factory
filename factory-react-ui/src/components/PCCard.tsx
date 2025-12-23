import { Link } from 'react-router-dom'
import { Server, Wifi, WifiOff, Play, Square } from 'lucide-react'
import type { FactoryPC } from '../types'

interface PCCardProps {
  pc: FactoryPC
}

export default function PCCard({ pc }: PCCardProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Link
      to={`/pc/${pc.pcId}`}
      className={`pc-card ${pc.isOnline ? 'online' : 'offline'}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="pc-card-header">
        <div className="pc-icon-wrapper">
          <Server className="pc-icon" size={28} strokeWidth={2} />
          <div className={`status-dot ${pc.isOnline ? 'online' : ''}`} />
        </div>
        <div className="pc-card-badges">
          <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'}`}>
            {pc.isOnline ? (
              <>
                <Wifi size={12} style={{ marginRight: '4px' }} />
                Online
              </>
            ) : (
              <>
                <WifiOff size={12} style={{ marginRight: '4px' }} />
                Offline
              </>
            )}
          </span>
          <span className={`badge ${pc.isApplicationRunning ? 'badge-success' : 'badge-neutral'}`}>
            {pc.isApplicationRunning ? (
              <>
                <Play size={12} style={{ marginRight: '4px' }} />
                Running
              </>
            ) : (
              <>
                <Square size={12} style={{ marginRight: '4px' }} />
                Stopped
              </>
            )}
          </span>
        </div>
      </div>

      <div className="pc-card-body">
        <h3 className="pc-name">
          Line {pc.lineNumber} - PC {pc.pcNumber}
        </h3>

        <div className="pc-info-row">
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>IP:</span>
          <span className="pc-info-value" style={{ fontFamily: 'monospace', marginLeft: '0.5rem' }}>
            {pc.ipAddress}
          </span>
        </div>

        <div className="pc-info-row">
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Version:</span>
          <span className="pc-info-value" style={{ marginLeft: '0.5rem' }}>
            {pc.modelVersion}
          </span>
        </div>

        <div className="pc-model-section">
          <div className="pc-model-label">Current Model</div>
          <div className="pc-model-name">
            {pc.currentModel?.modelName || 'No model selected'}
          </div>
        </div>

        {pc.lastHeartbeat && (
          <div style={{
            marginTop: 'var(--spacing-md)',
            fontSize: '0.75rem',
            color: 'var(--neutral-500)',
            textAlign: 'center'
          }}>
            Updated: {formatTime(pc.lastUpdated)}
          </div>
        )}
      </div>
    </Link>
  )
}

