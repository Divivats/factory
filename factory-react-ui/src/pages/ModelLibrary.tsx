import { useEffect, useState } from 'react'
import { Package, Upload, Trash2, Rocket, Download, X, HardDrive, AlertTriangle } from 'lucide-react'
import { factoryApi } from '../services/api'
import type { ModelFile, ApplyModelRequest } from '../types'

export default function ModelLibrary() {
    const [models, setModels] = useState<ModelFile[]>([])
    const [versions, setVersions] = useState<string[]>([])
    const [lines, setLines] = useState<number[]>([])
    const [loading, setLoading] = useState(true)

    // Modal States
    const [showUpload, setShowUpload] = useState(false)
    const [showDeploy, setShowDeploy] = useState(false)
    const [selectedModel, setSelectedModel] = useState<ModelFile | null>(null)

    // Upload Form
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadName, setUploadName] = useState('')
    const [uploadDesc, setUploadDesc] = useState('')
    const [uploadCategory, setUploadCategory] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    // Deploy Form
    const [applyTarget, setApplyTarget] = useState<'all' | 'version' | 'lines'>('all')
    const [applyVersion, setApplyVersion] = useState('')
    const [applyLines, setApplyLines] = useState<number[]>([])
    const [isDeploying, setIsDeploying] = useState(false)

    // Overwrite Confirm State
    const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false)
    const [overwriteStats, setOverwriteStats] = useState({ total: 0, existing: 0 })
    const [pendingRequest, setPendingRequest] = useState<ApplyModelRequest | null>(null)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [m, v, l] = await Promise.all([
                factoryApi.getLibraryModels(),
                factoryApi.getVersions(),
                factoryApi.getLines()
            ])
            setModels(m); setVersions(v); setLines(l);
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    // --- Handlers ---

    const handleDownload = async (model: ModelFile) => {
        try {
            const blob = await factoryApi.downloadModelTemplate(model.modelFileId)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = model.fileName
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) { alert('Download failed') }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this model?')) return
        try {
            await factoryApi.deleteModel(id)
            loadData()
        } catch (err) { alert('Delete failed') }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!uploadFile) return
        setIsUploading(true)
        try {
            await factoryApi.uploadModelToLibrary(
                uploadFile,
                uploadName || uploadFile.name.replace('.zip', ''),
                uploadDesc,
                uploadCategory
            )
            alert('Model uploaded!')
            setShowUpload(false)
            setUploadFile(null); setUploadName(''); setUploadDesc('');
            loadData()
        } catch (err) { alert('Upload failed') }
        finally { setIsUploading(false) }
    }

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedModel) return

        setIsDeploying(true)

        // Construct the base request
        const req: ApplyModelRequest = {
            modelFileId: selectedModel.modelFileId,
            targetType: (applyTarget === 'lines' ? 'line' : applyTarget) as any,
            // WAIT, backend 'line' target only takes SINGLE lineNumber. 
            // If we want multi-lines, we might need to iterate or update backend. 
            // For now, let's assume we iterate on frontend if multiple lines selected, OR we update backend to accept list.
            // Backend takes 'lineNumber' (int?). 
            // Let's iterate on frontend for checking/applying if multiple lines.
            // ACTUALLY, simpler: logic below will handle iteration if I structure it right.
            // But 'checkOnly' is per request.

            // LET'S SIMPLIFY: The backend 'targetType=line' takes ONE line. 
            // Creating a loop here is messy for "Check". 
            // If I want "All Lines" or "Multiple Lines", I should maybe use "selected" PC IDs?
            // Or just loop the requests.
            version: applyVersion || undefined,
            applyImmediately: true
        }

        // Implementation limitation: For "Lines" mode with multiple lines, we'll need to handle it specially.
        // If applyTarget is 'lines', we might need to send a request for EACH line or use a new targetType 'selected' with all PC IDs (heavy).
        // Let's stick to single line for now? user asked for "multiple lines".
        // OK, I'll implement loop for Apply, but for Check?
        // Check could just return aggregate.

        // ... Re-reading backend ... 
        // Backend `ApplyModelToTargets` takes `LineNumber` (nullable int).

        // Strategy: If 'lines', we loop. 
        // But the PROMPT needs to be aggregate. 
        // This is getting complicated to change backend now.
        // I will assume for now we use 'all' or 'version' or Single Line. 
        // User asked for "line wise slection or even multiple lines". 
        // I'll implement multi-line selection UI but maybe map it to "SelectedPCIds"? 
        // No, fetching all PCs is heavy.

        // Alternative: Use 'all' target but filter by lines? Not supported.

        // Let's go with: Cycle through selected lines for Check. Aggregate stats.
        try {
            let totalTargets = 0
            let existingCount = 0

            const linesToProcess = applyTarget === 'lines' ? applyLines : [null]

            // PHASE 1: CHECK
            for (const line of linesToProcess) {
                const checkReq = { ...req, checkOnly: true, lineNumber: line ?? undefined, targetType: (applyTarget === 'lines' ? 'line' : applyTarget) as any }
                const res = await factoryApi.applyModel(checkReq)
                if (res.checks) {
                    totalTargets += res.totalTargets
                    existingCount += res.existingCount
                }
            }

            if (existingCount > 0) {
                setOverwriteStats({ total: totalTargets, existing: existingCount })
                setPendingRequest(req) // Save base request
                setShowOverwriteConfirm(true)
                setIsDeploying(false)
                return
            }

            // If no collision, proceed to apply
            await executeApply(req, false)

        } catch (err: any) {
            alert('Deployment check failed: ' + err.message)
            setIsDeploying(false)
        }
    }

    const executeApply = async (baseReq: ApplyModelRequest, forceOverwrite: boolean) => {
        setIsDeploying(true)
        try {
            const linesToProcess = applyTarget === 'lines' ? applyLines : [null]

            for (const line of linesToProcess) {
                const finalReq = {
                    ...baseReq,
                    checkOnly: false,
                    forceOverwrite,
                    lineNumber: line ?? undefined,
                    targetType: (applyTarget === 'lines' ? 'line' : applyTarget) as any
                }
                await factoryApi.applyModel(finalReq)
            }

            alert('Deployment initiated successfully!')
            setShowDeploy(false)
            setShowOverwriteConfirm(false)
            setSelectedModel(null)
            setApplyLines([])
        } catch (err) { alert('Deployment failed') }
        finally { setIsDeploying(false) }
    }

    return (
        <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Sticky Header - Matches Dashboard */}
            <div className="dashboard-header">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <HardDrive size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <span>Model Library</span>
                        </h1>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {models.length} {models.length === 1 ? 'model' : 'models'}
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={() => setShowUpload(true)} style={{ fontSize: '0.85rem', padding: '0.5rem 0.875rem' }}>
                        <Upload size={15} /> Upload Model
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="dashboard-scroll-area">
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '3rem' }}>Loading library...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {models.map(m => (
                            <div key={m.modelFileId} className="card" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                transition: 'all 0.2s'
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: 'linear-gradient(135deg, var(--bg-hover), var(--bg-panel))',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    border: '1px solid var(--border)'
                                }}>
                                    <Package size={24} color="var(--primary)" />
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                                        <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{m.modelName}</h3>
                                        {m.category && <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{m.category}</span>}
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.375rem', margin: 0 }}>
                                        {m.description || 'No description provided.'}
                                    </p>
                                    <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                        {m.fileName} • {(m.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(m.uploadedDate).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => { setSelectedModel(m); setShowDeploy(true); }}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                                    >
                                        <Rocket size={14} /> Deploy
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-icon"
                                        onClick={() => handleDownload(m)}
                                        title="Download"
                                        style={{ padding: '0.4rem' }}
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        className="btn btn-danger btn-icon"
                                        onClick={() => handleDelete(m.modelFileId)}
                                        title="Delete"
                                        style={{ padding: '0.4rem' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {models.length === 0 && (
                            <div style={{
                                padding: '3rem',
                                border: '2px dashed var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'center',
                                color: 'var(--text-dim)',
                                background: 'var(--bg-hover)'
                            }}>
                                <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>No models found. Upload a .zip file to get started.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="modal-overlay" onClick={() => setShowUpload(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', height: 'auto' }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Upload Model</h3>
                            <button onClick={() => setShowUpload(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUpload} className="modal-body">
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ZIP File *</label>
                                <input type="file" accept=".zip" required className="input-field" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Model Name</label>
                                <input className="input-field" value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g. Production_RC1" />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
                                <input className="input-field" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Brief description..." />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
                                <input className="input-field" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} placeholder="e.g. Release, Beta" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isUploading}>
                                {isUploading ? 'Uploading...' : 'Upload Model'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Deploy Modal */}
            {showDeploy && selectedModel && (
                <div className="modal-overlay" onClick={() => setShowDeploy(false)}>
                    {!showOverwriteConfirm ? (
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', height: 'auto' }}>
                            <div className="modal-header">
                                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Deploy "{selectedModel.modelName}"</h3>
                                <button onClick={() => setShowDeploy(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleDeploy} className="modal-body">
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Scope</label>
                                    <select className="input-field" value={applyTarget} onChange={(e: any) => setApplyTarget(e.target.value)}>
                                        <option value="all">All PCs</option>
                                        <option value="version">By Version</option>
                                        <option value="lines">Specific Lines</option>
                                    </select>
                                </div>

                                {applyTarget === 'version' && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Version</label>
                                        <select className="input-field" required value={applyVersion} onChange={e => setApplyVersion(e.target.value)}>
                                            <option value="">Select Version...</option>
                                            {versions.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </div>
                                )}

                                {applyTarget === 'lines' && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Lines</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                            {lines.map(l => {
                                                const isSelected = applyLines.includes(l)
                                                return (
                                                    <div
                                                        key={l}
                                                        onClick={() => setApplyLines(prev => isSelected ? prev.filter(x => x !== l) : [...prev, l])}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '999px',
                                                            background: isSelected ? 'var(--primary)' : 'var(--bg-hover)',
                                                            color: isSelected ? 'white' : 'var(--text-main)',
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        Line {l}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {applyLines.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>Please select at least one line</div>}
                                    </div>
                                )}

                                <div style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    padding: '0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-main)', alignItems: 'flex-start' }}>
                                        <Rocket size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                                        <span>Smart Deployment: This will check for existing models on target PCs and optimize the transfer.</span>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isDeploying || (applyTarget === 'lines' && applyLines.length === 0)}>
                                    {isDeploying ? 'Checking Targets...' : 'Proceed to Deploy'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', height: 'auto' }}>
                            <div className="modal-header">
                                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Model Conflict Detected</h3>
                                <button onClick={() => setShowOverwriteConfirm(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
                            </div>
                            <div className="modal-body">
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)',
                                        color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                                    }}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                                        This model "{selectedModel.modelName}" is already present on <strong>{overwriteStats.existing}</strong> of {overwriteStats.total} target PCs.
                                    </p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        How would you like to proceed?
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'center', padding: '1rem' }}
                                        onClick={() => pendingRequest && executeApply(pendingRequest, false)}
                                        disabled={isDeploying}
                                    >
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 600 }}>Smart Switch (Fast)</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Use existing model on PCs, upload only where missing.</div>
                                        </div>
                                    </button>

                                    <button
                                        className="btn btn-primary"
                                        style={{ justifyContent: 'center', padding: '1rem' }}
                                        onClick={() => pendingRequest && executeApply(pendingRequest, true)}
                                        disabled={isDeploying}
                                    >
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 600 }}>Force Overwrite (Slower)</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Re-upload model to ALL target PCs.</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}