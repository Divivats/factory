import { useEffect, useState, useRef } from 'react'
import { X, Server, Download, Upload, Trash2, Check, RefreshCw, FileText, Folder } from 'lucide-react'
import { factoryApi } from '../services/api'
import type { PCDetails } from '../types'

interface PCDetailsModalProps {
  pcId: number
  onClose: () => void
}

export default function PCDetailsModal({ pcId, onClose }: PCDetailsModalProps) {
  const [pc, setPC] = useState<PCDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI States
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [showUploadModel, setShowUploadModel] = useState(false)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Polling Refs
  const pollTimer = useRef<number | null>(null) // For download status
  const refreshTimer = useRef<number | null>(null) // For silent background data refresh

  useEffect(() => {
    loadPC(true)
    
    // Silent background refresh every 5 seconds to keep status live
    refreshTimer.current = window.setInterval(() => {
      loadPC(false)
    }, 5000)

    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current)
      if (refreshTimer.current) window.clearInterval(refreshTimer.current)
    }
  }, [pcId])

  const loadPC = async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true)
      const data = await factoryApi.getPC(pcId)
      setPC(data)
      
      // Only set selected model on initial load so we don't annoy user if they changed it
      if (isInitial) {
        const currentModel = data.availableModels.find(m => m.isCurrentModel)
        if (currentModel) {
          setSelectedModel(currentModel.modelName)
        } else if (data.availableModels.length > 0) {
          setSelectedModel(data.availableModels[0].modelName)
        }
      }
    } catch (err) {
      console.error('Failed to load PC:', err)
      if (isInitial) setError('Failed to load PC details')
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  // --- ACTIONS ---

  const handleApplyModel = async () => {
    if (!pc || !selectedModel) return
    if (!confirm(`Apply model "${selectedModel}" to this PC?`)) return
    
    try {
      const result = await factoryApi.changeModel(pc.pcId, selectedModel)
      alert(result.message || 'Model change initiated!')
      loadPC(false) // Instant refresh
    } catch (err: any) {
      alert(err.message || 'Failed')
    }
  }

  const handleDownloadModel = async () => {
    if (!pc || !selectedModel) return
    
    try {
      setIsDownloading(true)
      const result = await factoryApi.downloadModelFromPC(pc.pcId, selectedModel)
      
      if (result.success && result.commandId) {
        pollDownloadStatus(result.commandId)
      } else {
        alert('Failed to start download.')
        setIsDownloading(false)
      }
    } catch (err: any) {
      alert(err.message)
      setIsDownloading(false)
    }
  }

  const pollDownloadStatus = async (commandId: number) => {
    try {
      const statusResult = await factoryApi.checkDownloadStatus(commandId)
      
      if (statusResult.status === 'Completed') {
        const link = document.createElement('a')
        link.href = statusResult.downloadUrl
        link.download = `${selectedModel}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setIsDownloading(false)
        alert('Download Complete')
      } else if (statusResult.status === 'Failed') {
        setIsDownloading(false)
        alert(`Download failed: ${statusResult.message}`)
      } else {
        pollTimer.current = window.setTimeout(() => pollDownloadStatus(commandId), 2000)
      }
    } catch {
      setIsDownloading(false)
    }
  }

  const handleUploadModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pc || !modelFile) return
    try {
      const result = await factoryApi.uploadModelToPC(pc.pcId, modelFile)
      alert(result.message)
      setShowUploadModel(false)
      setModelFile(null)
      loadPC(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteModel = async () => {
    if (!pc || !selectedModel) return
    const current = pc.availableModels.find(m => m.isCurrentModel)
    if (current && current.modelName === selectedModel) {
      alert('Cannot delete active model')
      return
    }
    if (!confirm(`Delete model "${selectedModel}"?`)) return
    try {
      await factoryApi.deleteModelFromPC(pc.pcId, selectedModel)
      alert('Deleted')
      loadPC(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <RefreshCw className="animate-spin" size={32} color="var(--primary-500)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Connecting to PC...</p>
      </div>
    </div>
  )

  if (!pc) return null

  const currentModel = pc.availableModels.find(m => m.isCurrentModel)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              background: pc.isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '10px', borderRadius: '10px', color: pc.isOnline ? '#34d399' : '#f87171'
            }}>
              <Server size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>Line {pc.lineNumber} - PC {pc.pcNumber}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span className={`badge ${pc.isOnline ? 'badge-success' : 'badge-danger'}`}>
                  {pc.isOnline ? 'Online' : 'Offline'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                  {pc.ipAddress}
                </span>
              </div>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem' }}>
            
            {/* LEFT COLUMN: Models */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Model Management
              </h3>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                {/* Active Model Display */}
                {currentModel && (
                   <div style={{ 
                     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                     background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.3)',
                     padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem'
                   }}>
                     <div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 700, textTransform: 'uppercase' }}>Current Active Model</div>
                       <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{currentModel.modelName}</div>
                     </div>
                     <Check size={20} color="var(--primary-400)" />
                   </div>
                )}

                {/* Controls */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="form-select"
                    style={{ 
                      flex: 1, padding: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', 
                      color: 'white', borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {pc.availableModels.map(m => (
                      <option key={m.modelId} value={m.modelName}>
                        {m.modelName} {m.isCurrentModel ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={handleApplyModel} disabled={!selectedModel || selectedModel === currentModel?.modelName} className="btn btn-primary">
                    <Check size={16} /> Apply
                  </button>
                  <button onClick={handleDownloadModel} disabled={isDownloading || !selectedModel} className="btn btn-secondary">
                    {isDownloading ? 'Zipping...' : <><Download size={16} /> Download</>}
                  </button>
                  <button onClick={() => setShowUploadModel(true)} className="btn btn-secondary">
                    <Upload size={16} /> Upload New
                  </button>
                  <button onClick={handleDeleteModel} disabled={selectedModel === currentModel?.modelName} className="btn btn-danger">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Info & Config */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                System Details
              </h3>
              
              <table className="info-table" style={{ marginBottom: '2rem' }}>
                <tbody>
                  <tr><td>Version</td><td>{pc.modelVersion}</td></tr>
                  <tr><td>Last Heartbeat</td><td>{pc.lastHeartbeat ? new Date(pc.lastHeartbeat).toLocaleTimeString() : 'Never'}</td></tr>
                  <tr><td>Config Path</td><td style={{ fontSize: '0.8rem' }}>{pc.configFilePath}</td></tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Configuration
              </h3>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                   <FileText size={20} color="var(--text-muted)" />
                   <div style={{ fontSize: '0.9rem' }}>config.ini</div>
                </div>
                <button 
                  onClick={async () => {
                     const blob = await factoryApi.downloadConfig(pc.pcId);
                     const url = window.URL.createObjectURL(blob);
                     const a = document.createElement('a'); a.href=url; a.download='config.ini'; a.click();
                  }}
                  className="btn btn-secondary" style={{ width: '100%' }}
                >
                  <Download size={16} /> Download Config
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Upload Overlay inside Modal */}
        {showUploadModel && (
          <div style={{ 
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '400px', border: '1px solid var(--border-highlight)' }}>
              <h3>Upload Model (ZIP)</h3>
              <input type="file" accept=".zip" onChange={e => setModelFile(e.target.files?.[0] || null)} style={{ margin: '1rem 0', color: 'white' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleUploadModel} className="btn btn-primary" style={{ flex: 1 }}>Upload</button>
                <button onClick={() => setShowUploadModel(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}