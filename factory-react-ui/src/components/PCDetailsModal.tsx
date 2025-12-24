import { useEffect, useState, useRef } from 'react'
import { X, Server, Activity, FileCode, Upload, Download, Trash2, RefreshCw, CheckCircle, AlertTriangle, FileText, Cpu, Wifi } from 'lucide-react'
import { factoryApi } from '../services/api'
import type { FactoryPC, PCDetails } from '../types'

interface Props {
  pcSummary: FactoryPC
  onClose: () => void
}

export default function PCDetailsModal({ pcSummary, onClose }: Props) {
  const [pc, setPc] = useState<PCDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState('')
  
  // Action States
  const [isApplying, setIsApplying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloadingModel, setIsDownloadingModel] = useState(false)
  
  // Upload States
  const [showUploadUI, setShowUploadUI] = useState<'model' | 'config' | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const mounted = useRef(true)
  const pollTimer = useRef<number | null>(null)

  useEffect(() => {
    mounted.current = true
    loadData(true)
    // Fast polling (3s) to keep status live
    const interval = setInterval(() => loadData(false), 3000)
    return () => { 
      mounted.current = false
      clearInterval(interval)
      if (pollTimer.current) clearTimeout(pollTimer.current)
    }
  }, [pcSummary.pcId])

  const loadData = async (isInitial: boolean) => {
    if (isInitial) setLoading(true)
    try {
      const data = await factoryApi.getPC(pcSummary.pcId)
      if (mounted.current) {
        setPc(data)
        // Auto-select current model if nothing selected
        if (isInitial && !selectedModel) {
           const active = data.availableModels.find(m => m.isCurrentModel)
           if (active) setSelectedModel(active.modelName)
           else if (data.availableModels.length > 0) setSelectedModel(data.availableModels[0].modelName)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (isInitial && mounted.current) setLoading(false)
    }
  }

  // --- Actions ---

  const handleApplyModel = async () => {
    if (!pc || !selectedModel) return
    if (!confirm(`Apply model "${selectedModel}" to PC-${pc.pcNumber}?`)) return
    
    setIsApplying(true)
    try {
      const res = await factoryApi.changeModel(pc.pcId, selectedModel)
      alert(res.message || 'Model change initiated!')
      await loadData(false)
    } catch (err: any) {
      alert(err.message || 'Failed to apply model')
    } finally {
      setIsApplying(false)
    }
  }

  const handleDeleteModel = async () => {
    if (!pc || !selectedModel) return
    if (!confirm(`Permanently DELETE model "${selectedModel}" from PC-${pc.pcNumber}?`)) return

    setIsDeleting(true)
    try {
      const res = await factoryApi.deleteModelFromPC(pc.pcId, selectedModel)
      alert(res.message || 'Model deleted')
      setSelectedModel('') // Reset selection
      await loadData(false)
    } catch (err: any) {
      alert(err.message || 'Failed to delete model')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadConfig = async () => {
    if (!pc) return
    try {
        const blob = await factoryApi.downloadConfig(pc.pcId)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `config_Line${pc.lineNumber}_PC${pc.pcNumber}.ini`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
    } catch (err: any) {
        alert(err.message || 'Failed to download config')
    }
  }

  // Complex Download Logic (Server Polling)
  const handleDownloadModelFromPC = async () => {
    if (!pc || !selectedModel) return
    if (!confirm(`Download "${selectedModel}" from PC to Server? This may take time.`)) return

    setIsDownloadingModel(true)
    try {
        const result = await factoryApi.downloadModelFromPC(pc.pcId, selectedModel)
        if (result.success && result.commandId) {
            pollDownloadStatus(result.commandId)
        } else {
            alert('Failed to start download command.')
            setIsDownloadingModel(false)
        }
    } catch (err: any) {
        alert(err.message || 'Failed to init download')
        setIsDownloadingModel(false)
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
            setIsDownloadingModel(false)
            alert('Download complete!')
        } else if (statusResult.status === 'Failed') {
            setIsDownloadingModel(false)
            alert(`Download failed: ${statusResult.message}`)
        } else {
            // Keep polling
            pollTimer.current = window.setTimeout(() => pollDownloadStatus(commandId), 2000)
        }
    } catch (error) {
        setIsDownloadingModel(false)
        console.error(error)
    }
  }

  const handleUpload = async () => {
    if (!pc || !uploadFile) return
    setIsUploading(true)
    try {
      if (showUploadUI === 'model') {
        await factoryApi.uploadModelToPC(pc.pcId, uploadFile)
      } else {
        await factoryApi.uploadConfig(pc.pcId, uploadFile)
      }
      alert('Upload successful!')
      setShowUploadUI(null)
      setUploadFile(null)
      await loadData(false)
    } catch (err: any) {
      alert(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const display = pc || (pcSummary as unknown as PCDetails)
  const activeModel = pc?.availableModels.find(m => m.isCurrentModel)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <div className="pulse" style={{ color: display.isOnline ? 'var(--success)' : 'var(--danger)' }} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>PC-{display.pcNumber}</h2>
              <div className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {display.ipAddress} • Line {display.lineNumber}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading && !pc ? (
             <div style={{textAlign:'center', padding:'3rem', color:'var(--text-dim)'}}>Loading system details...</div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'2rem'}}>
              
              {/* Status Cards */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem'}}>
                <div className="card" style={{padding:'1rem', display:'flex', gap:'1rem', alignItems:'center'}}>
                   <Cpu size={24} color={display.isApplicationRunning ? 'var(--success)' : 'var(--text-dim)'} />
                   <div>
                     <div style={{fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600}}>APP STATE</div>
                     <div>{display.isApplicationRunning ? 'Running' : 'Stopped'}</div>
                   </div>
                </div>
                <div className="card" style={{padding:'1rem', display:'flex', gap:'1rem', alignItems:'center'}}>
                   <Activity size={24} color="var(--primary)" />
                   <div>
                     <div style={{fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600}}>VERSION</div>
                     <div className="text-mono">{display.modelVersion}</div>
                   </div>
                </div>
                <div className="card" style={{padding:'1rem', display:'flex', gap:'1rem', alignItems:'center'}}>
                   <Wifi size={24} color={display.isOnline ? 'var(--success)' : 'var(--danger)'} />
                   <div>
                     <div style={{fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600}}>NETWORK</div>
                     <div>{display.isOnline ? 'Online' : 'Offline'}</div>
                   </div>
                </div>
              </div>

              {/* Model Manager */}
              <div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                   <h3 style={{fontSize:'1rem', fontWeight:600, color:'var(--primary)'}}>Model Management</h3>
                   {activeModel && <span className="badge badge-success">Active: {activeModel.modelName}</span>}
                </div>
                
                <div className="card">
                  <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem'}}>
                    <select 
                       className="input-field" 
                       value={selectedModel} 
                       onChange={e => setSelectedModel(e.target.value)}
                    >
                      <option value="" disabled>Select a model...</option>
                      {pc?.availableModels.map(m => (
                        <option key={m.modelId} value={m.modelName}>
                          {m.modelName} {m.isCurrentModel ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-secondary btn-icon" onClick={() => loadData(false)}>
                      <RefreshCw size={18} />
                    </button>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                     <button 
                       className="btn btn-primary"
                       disabled={isApplying || !selectedModel || activeModel?.modelName === selectedModel}
                       onClick={handleApplyModel}
                     >
                       {isApplying ? <div className="pulse" style={{background:'black'}}/> : <CheckCircle size={16}/>}
                       {isApplying ? 'Applying...' : 'Apply Model'}
                     </button>
                     
                     <button className="btn btn-secondary" onClick={() => setShowUploadUI('model')}>
                       <Upload size={16}/> Upload New
                     </button>

                     <button 
                       className="btn btn-secondary"
                       disabled={isDownloadingModel || !selectedModel}
                       onClick={handleDownloadModelFromPC}
                     >
                       {isDownloadingModel ? <div className="pulse"/> : <Download size={16}/>}
                       {isDownloadingModel ? 'Downloading...' : 'Download'}
                     </button>

                     <button 
                       className="btn btn-danger"
                       disabled={isDeleting || !selectedModel || activeModel?.modelName === selectedModel}
                       onClick={handleDeleteModel}
                     >
                       {isDeleting ? <div className="pulse"/> : <Trash2 size={16}/>}
                       {isDeleting ? 'Deleting...' : 'Delete'}
                     </button>
                  </div>
                </div>
              </div>

              {/* Config Section */}
              <div>
                 <h3 style={{fontSize:'1rem', fontWeight:600, color:'var(--primary)', marginBottom:'0.5rem'}}>Configuration</h3>
                 <div className="card" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                    <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                       <FileText size={24} color="var(--text-muted)"/>
                       <div>
                          <div className="text-mono">config.ini</div>
                          <div style={{fontSize:'0.75rem', color:'var(--text-dim)'}}>
                             Last Modified: {pc?.config ? new Date(pc.config.lastModified).toLocaleDateString() : 'N/A'}
                          </div>
                       </div>
                    </div>
                    <div style={{display:'flex', gap:'0.5rem'}}>
                       <button className="btn btn-secondary" onClick={() => setShowUploadUI('config')}>Upload</button>
                       <button className="btn btn-secondary" onClick={handleDownloadConfig} disabled={!pc?.config}>Download</button>
                    </div>
                 </div>
              </div>

            </div>
          )}
        </div>

        {/* Upload Overlay */}
        {showUploadUI && (
          <div className="modal-overlay" style={{zIndex: 1100}} onClick={() => setShowUploadUI(null)}>
             <div className="modal-content" style={{maxWidth:'400px', height:'auto'}} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                   <h3>Upload {showUploadUI === 'model' ? 'Model' : 'Config'}</h3>
                   <button onClick={() => setShowUploadUI(null)} className="btn btn-icon btn-secondary"><X size={18}/></button>
                </div>
                <div className="modal-body">
                   <div style={{border:'2px dashed var(--border)', borderRadius:'var(--radius-md)', padding:'2rem', textAlign:'center', marginBottom:'1.5rem'}}>
                      <input 
                        type="file" 
                        accept={showUploadUI === 'model' ? ".zip" : ".ini,.txt"}
                        onChange={e => setUploadFile(e.target.files?.[0] || null)}
                        style={{color: 'var(--text-main)'}}
                      />
                   </div>
                   <button 
                     className="btn btn-primary" 
                     style={{width:'100%'}} 
                     onClick={handleUpload}
                     disabled={isUploading || !uploadFile}
                   >
                     {isUploading ? 'Uploading...' : 'Confirm Upload'}
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  )
}