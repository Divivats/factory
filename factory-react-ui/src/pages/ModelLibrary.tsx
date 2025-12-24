import { useEffect, useState } from 'react'
import { Package, Upload, Trash2, Rocket, Download, X, HardDrive } from 'lucide-react'
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
    const [applyTarget, setApplyTarget] = useState<'all' | 'version' | 'line' | 'lineandversion'>('all')
    const [applyVersion, setApplyVersion] = useState('')
    const [applyLine, setApplyLine] = useState<number | ''>('')
    const [isDeploying, setIsDeploying] = useState(false)

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
        const req: ApplyModelRequest = {
            modelFileId: selectedModel.modelFileId,
            targetType: applyTarget,
            version: applyVersion || undefined,
            lineNumber: applyLine ? Number(applyLine) : undefined,
            applyImmediately: true
        }

        try {
            const res = await factoryApi.applyModel(req)
            alert(res.message)
            setShowDeploy(false)
            setSelectedModel(null)
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
                                    <option value="line">By Line</option>
                                    <option value="lineandversion">Version + Line</option>
                                </select>
                            </div>

                            {(applyTarget === 'version' || applyTarget === 'lineandversion') && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Version</label>
                                    <select className="input-field" required value={applyVersion} onChange={e => setApplyVersion(e.target.value)}>
                                        <option value="">Select Version...</option>
                                        {versions.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                            )}

                            {(applyTarget === 'line' || applyTarget === 'lineandversion') && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Line</label>
                                    <select className="input-field" required value={applyLine} onChange={e => setApplyLine(Number(e.target.value))}>
                                        <option value="">Select Line...</option>
                                        {lines.map(l => <option key={l} value={l}>Line {l}</option>)}
                                    </select>
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
                                    <span>This will immediately push the model to all matching PCs.</span>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isDeploying}>
                                {isDeploying ? 'Deploying...' : 'Confirm Deployment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}