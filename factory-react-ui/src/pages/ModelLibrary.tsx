import { useEffect, useState } from 'react'
import { Package, Upload, Trash2, Rocket, Filter, Download } from 'lucide-react'
import { factoryApi } from '../services/api'
import type { ModelFile, ApplyModelRequest } from '../types'

export default function ModelLibrary() {
  const [models, setModels] = useState<ModelFile[]>([])
  const [versions, setVersions] = useState<string[]>([])
  const [lines, setLines] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelFile | null>(null)

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadCategory, setUploadCategory] = useState('')

  // Apply form state
  const [applyTarget, setApplyTarget] = useState<'all' | 'version' | 'line' | 'lineandversion'>('all')
  const [applyVersion, setApplyVersion] = useState('')
  const [applyLine, setApplyLine] = useState<number | ''>('')
  const [applyImmediately, setApplyImmediately] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [modelsData, versionsData, linesData] = await Promise.all([
        factoryApi.getLibraryModels(),
        factoryApi.getVersions(),
        factoryApi.getLines()
      ])
      setModels(modelsData)
      setVersions(versionsData)
      setLines(linesData)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      alert('Please select a file')
      return
    }

    try {
      await factoryApi.uploadModelToLibrary(
        uploadFile,
        uploadName || uploadFile.name.replace('.zip', ''),
        uploadDesc || undefined,
        uploadCategory || undefined
      )
      alert('Model uploaded successfully!')
      setShowUploadModal(false)
      resetUploadForm()
      loadData()
    } catch (err) {
      alert('Failed to upload model')
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModel) return

    const request: ApplyModelRequest = {
      modelFileId: selectedModel.modelFileId,
      targetType: applyTarget,
      applyImmediately
    }

    if (applyTarget === 'version' || applyTarget === 'lineandversion') {
      if (!applyVersion) {
        alert('Please select a version')
        return
      }
      request.version = applyVersion
    }

    if (applyTarget === 'line' || applyTarget === 'lineandversion') {
      if (!applyLine) {
        alert('Please select a line')
        return
      }
      request.lineNumber = applyLine as number
    }

    try {
      const result = await factoryApi.applyModel(request)
      alert(result.message)
      setShowApplyModal(false)
      resetApplyForm()
    } catch (err) {
      alert('Failed to apply model')
    }
  }

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
    } catch (err) {
      alert('Failed to download model')
    }
  }

  const handleDelete = async (model: ModelFile) => {
    if (!confirm(`Delete model "${model.modelName}"?`)) return

    try {
      await factoryApi.deleteModel(model.modelFileId)
      alert('Model deleted successfully!')
      loadData()
    } catch (err) {
      alert('Failed to delete model')
    }
  }

  const resetUploadForm = () => {
    setUploadFile(null)
    setUploadName('')
    setUploadDesc('')
    setUploadCategory('')
  }

  const resetApplyForm = () => {
    setSelectedModel(null)
    setApplyTarget('all')
    setApplyVersion('')
    setApplyLine('')
    setApplyImmediately(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <>
      {/* Header */}
      <div className="main-header">
        <div className="header-title-section">
          <h1 className="header-title">Model Library</h1>
          <p className="header-subtitle">
            Manage model templates and deploy to factory PCs
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            <Upload size={16} />
            Upload Model
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--neutral-400)' }}>
            Loading models...
          </div>
        ) : models.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-3xl)',
            background: 'var(--neutral-800)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--neutral-700)'
          }}>
            <Package size={64} color="var(--neutral-600)" strokeWidth={1.5} style={{ margin: '0 auto var(--spacing-lg)' }} />
            <h2 style={{ color: 'var(--neutral-300)', marginBottom: 'var(--spacing-sm)' }}>
              No Models in Library
            </h2>
            <p style={{ color: 'var(--neutral-500)', marginBottom: 'var(--spacing-lg)' }}>
              Upload your first model ZIP to get started
            </p>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
              <Upload size={16} />
              Upload Model
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
            {models.map((model) => (
              <div
                key={model.modelFileId}
                style={{
                  background: 'var(--neutral-800)',
                  border: '1px solid var(--neutral-700)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--spacing-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-lg)'
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(135deg, var(--primary-700), var(--primary-500))',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Package size={32} color="white" strokeWidth={2} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{model.modelName}</h3>
                    {model.category && (
                      <span className="badge badge-primary">{model.category}</span>
                    )}
                  </div>

                  {model.description && (
                    <p style={{ color: 'var(--neutral-400)', fontSize: '0.9375rem', marginBottom: 'var(--spacing-sm)' }}>
                      {model.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                    <span>📄 {model.fileName}</span>
                    <span>💾 {formatFileSize(model.fileSize)}</span>
                    <span>📅 {new Date(model.uploadedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <button
                    onClick={() => {
                      setSelectedModel(model)
                      setShowApplyModal(true)
                    }}
                    className="btn btn-success"
                  >
                    <Rocket size={16} />
                    Deploy
                  </button>
                  <button
                    onClick={() => handleDownload(model)}
                    className="btn btn-primary btn-icon"
                    title="Download ZIP"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(model)}
                    className="btn btn-danger btn-icon"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowUploadModal(false)}
        >
          <div style={{
            background: 'var(--neutral-800)',
            border: '1px solid var(--neutral-700)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-2xl)',
            width: '90%',
            maxWidth: '500px'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>
              Upload Model to Library
            </h2>

            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                  Model ZIP File *
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    background: 'var(--neutral-700)',
                    border: '1px solid var(--neutral-600)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--neutral-200)'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                  Model Name
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Leave blank to use filename"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    background: 'var(--neutral-700)',
                    border: '1px solid var(--neutral-600)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--neutral-200)',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                  Description
                </label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Model description..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    background: 'var(--neutral-700)',
                    border: '1px solid var(--neutral-600)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--neutral-200)',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                  Category
                </label>
                <input
                  type="text"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  placeholder="e.g., Production, Testing, etc."
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    background: 'var(--neutral-700)',
                    border: '1px solid var(--neutral-600)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--neutral-200)',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Upload size={16} />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
                    resetUploadForm()
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedModel && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowApplyModal(false)}
        >
          <div style={{
            background: 'var(--neutral-800)',
            border: '1px solid var(--neutral-700)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-2xl)',
            width: '90%',
            maxWidth: '500px'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
              Deploy Model
            </h2>
            <p style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-xl)' }}>
              Deploy "{selectedModel.modelName}" to selected PCs
            </p>

            <form onSubmit={handleApply}>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                  Target
                </label>
                <select
                  value={applyTarget}
                  onChange={(e) => setApplyTarget(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    background: 'var(--neutral-700)',
                    border: '1px solid var(--neutral-600)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--neutral-200)',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="all">All PCs</option>
                  <option value="version">By Version</option>
                  <option value="line">By Line</option>
                  <option value="lineandversion">By Version + Line</option>
                </select>
              </div>

              {(applyTarget === 'version' || applyTarget === 'lineandversion') && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                    Version
                  </label>
                  <select
                    value={applyVersion}
                    onChange={(e) => setApplyVersion(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      background: 'var(--neutral-700)',
                      border: '1px solid var(--neutral-600)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--neutral-200)',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="">Select version...</option>
                    {versions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}

              {(applyTarget === 'line' || applyTarget === 'lineandversion') && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                    Line
                  </label>
                  <select
                    value={applyLine}
                    onChange={(e) => setApplyLine(e.target.value ? parseInt(e.target.value) : '')}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      background: 'var(--neutral-700)',
                      border: '1px solid var(--neutral-600)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--neutral-200)',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="">Select line...</option>
                    {lines.map(l => (
                      <option key={l} value={l}>Line {l}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={applyImmediately}
                    onChange={(e) => setApplyImmediately(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Apply model immediately after download</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  <Rocket size={16} />
                  Deploy Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false)
                    resetApplyForm()
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

