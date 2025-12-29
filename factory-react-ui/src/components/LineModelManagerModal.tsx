import { useEffect, useState } from 'react'
import { X, CheckCircle, RefreshCw, AlertTriangle, Layers, Cloud, Wifi, Trash2, Download } from 'lucide-react'
import { factoryApi } from '../services/api'
import type { LineModelOption } from '../types'

interface Props {
    lineNumber: number
    onClose: () => void
}

export default function LineModelManagerModal({ lineNumber, onClose }: Props) {
    const [loading, setLoading] = useState(true)
    const [models, setModels] = useState<LineModelOption[]>([])
    const [selectedModel, setSelectedModel] = useState<string>('')

    // Action state
    const [isApplying, setIsApplying] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [forceOverwrite, setForceOverwrite] = useState(false)

    useEffect(() => {
        loadModels()
    }, [lineNumber])

    const loadModels = async () => {
        setLoading(true)
        try {
            const data = await factoryApi.getLineAvailableModels(lineNumber)
            setModels(data)
        } catch (err) {
            console.error(err)
            alert("Failed to load line models")
        } finally {
            setLoading(false)
        }
    }

    const handleApply = async () => {
        if (!selectedModel) return

        // Find model details
        const model = models.find(m => m.modelName === selectedModel)
        if (!model) return

        // Local Only Logic
        if (!model.inLibrary && !model.modelFileId) {
            // Check if present on ALL PCs
            const isFullyCompliant = model.complianceCount === model.totalPCsInLine

            if (!isFullyCompliant) {
                alert("This Local-Only model is missing from some PCs. You must upload it to the Library first to deploy it to the entire line.")
                return
            }
        }

        if (!confirm(`Apply model "${selectedModel}" to ALL PCs in Line ${lineNumber}?` + (forceOverwrite ? "\nWARNING: Force Overwrite is ON. This will re-upload the model to all PCs." : ""))) return

        setIsApplying(true)
        try {
            const payload = {
                modelFileId: model.modelFileId || 0,
                targetType: 'line',
                lineNumber: lineNumber,
                applyImmediately: true,
                forceOverwrite: forceOverwrite,
                modelName: model.modelName
            }

            const res = await factoryApi.applyModelToTargets(payload)

            alert(res.message)
            loadModels()
            onClose()
        } catch (err: any) {
            alert(err.message || 'Failed to apply model')
        } finally {
            setIsApplying(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedModel) return
        if (!confirm(`Are you sure you want to delete "${selectedModel}" from all PCs in Line ${lineNumber}? This action cannot be undone.`)) return

        setIsDeleting(true)
        try {
            const res = await factoryApi.deleteLineModel(lineNumber, selectedModel)
            alert(res.message)
            loadModels()
            setSelectedModel('')
        } catch (err: any) {
            alert(err.message || 'Delete failed')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDownload = async () => {
        const model = models.find(m => m.modelName === selectedModel)
        if (!model) return

        if (!model.inLibrary) {
            alert("This model is Local Only. To download it, please go to the PC Details of a unit that has it and use 'Fetch to Library' (Coming Soon).")
            return
        }

        if (model.modelFileId) {
            try {
                const blob = await factoryApi.downloadModelTemplate(model.modelFileId)
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${model.modelName}.zip`
                document.body.appendChild(a)
                a.click()
                a.remove()
                window.URL.revokeObjectURL(url)
            } catch (err) { alert('Download failed') }
        }
    }

    const getSelectedModelInfo = () => models.find(m => m.modelName === selectedModel)


    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>

                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Layers size={20} color="var(--primary)" />
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Line {lineNumber} Manager</h2>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage models for all units in this line</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-secondary btn-icon"><X size={20} /></button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>Loading models...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Model Selection */}
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                                    Select Target Model
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select
                                        className="input-field"
                                        value={selectedModel}
                                        onChange={e => setSelectedModel(e.target.value)}
                                    >
                                        <option value="" disabled>Select a model...</option>
                                        {models.map(m => (
                                            <option key={m.modelName} value={m.modelName}>
                                                {m.modelName} • {m.inLibrary ? 'Library' : 'Local Only'} • {m.complianceText}
                                            </option>
                                        ))}
                                    </select>
                                    <button className="btn btn-secondary btn-icon" onClick={loadModels}><RefreshCw size={18} /></button>
                                </div>
                            </div>

                            {/* Selected Model Details */}
                            {selectedModel && (
                                <div className="card" style={{ padding: '1rem', background: 'var(--bg-hover)' }}>
                                    {(() => {
                                        const m = getSelectedModelInfo()
                                        if (!m) return null

                                        const isFullyCompliant = m.complianceCount === m.totalPCsInLine

                                        return (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{m.modelName}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                            {m.inLibrary ? (
                                                                <span className="badge badge-success" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}><Cloud size={10} /> Library</span>
                                                            ) : (
                                                                <span className="badge badge-warning" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}><Wifi size={10} /> PC Local</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: isFullyCompliant ? 'var(--success)' : 'var(--primary)' }}>
                                                            {Math.round((m.complianceCount / m.totalPCsInLine) * 100)}%
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Compliance</div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                                        <span>Deployment Progress</span>
                                                        <span>{m.complianceText}</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${(m.complianceCount / m.totalPCsInLine) * 100}%`,
                                                            background: isFullyCompliant ? 'var(--success)' : 'var(--primary)',
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                    </div>
                                                </div>

                                                {/* Options */}
                                                {m.inLibrary && (
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={forceOverwrite}
                                                                onChange={e => setForceOverwrite(e.target.checked)}
                                                            />
                                                            <span>Force Overwrite (Re-upload model to all PCs)</span>
                                                        </label>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                                                        onClick={handleApply}
                                                        disabled={isApplying || (!m.inLibrary && m.complianceCount < m.totalPCsInLine)}
                                                    >
                                                        {isApplying ? <div className="pulse" style={{ background: 'black' }} /> : <CheckCircle size={18} />}
                                                        {isApplying ? 'Deploying...' :
                                                            (m.inLibrary ? 'Deploy to Line' :
                                                                (m.complianceCount === m.totalPCsInLine ? 'Activate on All' : 'Upload to Library First')
                                                            )
                                                        }
                                                    </button>

                                                    <button
                                                        className="btn btn-secondary btn-icon"
                                                        style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        onClick={handleDownload}
                                                        title={m.inLibrary ? "Download ZIP from Library" : "Download unavailable (Local Only)"}
                                                    >
                                                        <Download size={20} style={{ opacity: m.inLibrary ? 1 : 0.5 }} />
                                                    </button>

                                                    <button
                                                        className="btn btn-danger btn-icon"
                                                        style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        onClick={handleDelete}
                                                        disabled={isDeleting}
                                                        title="Delete from Line"
                                                    >
                                                        {isDeleting ? <div className="pulse" /> : <Trash2 size={20} />}
                                                    </button>
                                                </div>

                                                {!m.inLibrary && m.complianceCount < m.totalPCsInLine && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem', textAlign: 'center' }}>
                                                        <AlertTriangle size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                        This model must be uploaded to the server library before it can be deployed to the line.
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}

                            {!selectedModel && (
                                <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-dim)' }}>
                                    <Layers size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <div>Select a model to view details</div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
