import { useState, useRef } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import { Upload, FileText, AlertTriangle, CheckCircle, Download, X, Table } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

// ─── Upload History sub-component ─────────────────────────────────────────────

function UploadHistory() {
  const [history, setHistory] = useState([])
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    if (loaded) return
    try {
      const { data } = await api.get('/api/upload/history')
      setHistory(data); setLoaded(true)
    } catch {}
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-charcoal font-display">Upload History</h3>
        <button onClick={load} className="btn-ghost text-xs">Load History</button>
      </div>
      {!loaded ? (
        <p className="text-sm text-muted text-center py-4">Click "Load History" to see past uploads</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">No uploads yet</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {['File', 'Week', 'Valid', 'Errors', 'Uploaded At'].map(h => (
                  <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="table-row">
                  <td className="table-cell font-medium text-charcoal">{h.original_filename}</td>
                  <td className="table-cell text-muted text-xs">{h.week_label}</td>
                  <td className="table-cell"><span className="badge-green">{h.valid_rows}</span></td>
                  <td className="table-cell">
                    {h.error_rows > 0
                      ? <span className="badge-red">{h.error_rows}</span>
                      : <span className="badge-green">0</span>
                    }
                  </td>
                  <td className="table-cell text-muted text-xs">{new Date(h.uploaded_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExcelUpload() {
  const { toast } = useToast()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [validation, setValidation] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [skipDupes, setSkipDupes] = useState(true)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.match(/\.(xlsx|xls)$/i)) { setError('Only .xlsx or .xls files allowed'); return }
    setFile(f); setValidation(null); setSuccess(null); setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const validateFile = async () => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/api/upload/validate', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setValidation(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Dry-run validation failed. Please check the file formatting.')
    }
  }

  const uploadFile = async () => {
    if (!file) return
    setUploading(true); setError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('skip_duplicates', skipDupes)
    try {
      const { data } = await api.post('/api/upload/excel', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSuccess(data); setFile(null); setValidation(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please check the file format.')
    } finally { setUploading(false) }
  }

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/api/upload/template', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = 'devtracker_template.xlsx'; a.click()
    } catch { toast.error('Template download failed') }
  }

  return (
    <Layout title="Bulk Upload" subtitle="Upload weekly developer status sheet (.xlsx format only)">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-card p-4">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 mb-1">Format Requirements</p>
            <p className="text-xs text-amber-700">
              Ensure your Excel file follows the standard template. Required columns:
              <span className="font-semibold"> Development Subject</span>.
              Optional: Track, Dev Type, Type of Development, CD, Functional Team, Developers, Start Date, End Date, Time (Min), Status, Remarks.
            </p>
          </div>
          <button onClick={downloadTemplate} className="btn-amber text-xs flex-shrink-0">
            <Download size={13} /> Download Template
          </button>
        </div>

        {/* Success */}
        {success && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-card p-4 animate-fade-in">
            <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">Upload Successful!</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                {success.valid_rows} logs imported · {success.error_rows} errors · Week: <span className="font-semibold">{success.week_label || '—'}</span>
              </p>
              <p className="text-xs text-emerald-600 mt-1">Admin has been notified of your upload.</p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-600"><X size={15} /></button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-card p-4 animate-fade-in">
            <X size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X size={15} /></button>
          </div>
        )}

        {/* Drop zone */}
        <div className="card">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${
              dragging ? 'border-forest-600 bg-forest-50'
              : file    ? 'border-forest-400 bg-forest-50/50'
              : 'border-slate-200 hover:border-forest-400 hover:bg-forest-50/30'
            }`}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <div className="space-y-2">
                <FileText size={40} className="mx-auto text-forest-600" />
                <p className="font-semibold text-charcoal">{file.name}</p>
                <p className="text-sm text-muted">{(file.size / 1024).toFixed(1)} KB · Ready to upload</p>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setValidation(null) }}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto">
                  <X size={12} /> Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload size={40} className="mx-auto text-slate-300" />
                <div>
                  <p className="font-semibold text-charcoal">Drag & drop your .xlsx file here</p>
                  <p className="text-sm text-muted mt-1">or <span className="text-forest-600 font-medium underline">browse file</span></p>
                </div>
                <p className="text-xs text-slate-400">Max file size: 10MB · .xlsx and .xls only</p>
              </div>
            )}
          </div>

          {/* File options */}
          {file && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-forest-600" checked={skipDupes} onChange={e => setSkipDupes(e.target.checked)} />
                <span className="text-sm text-charcoal">Skip duplicate entries</span>
              </label>
              <div className="flex items-center gap-2">
                <button onClick={validateFile} className="btn-outline text-xs">
                  <Table size={13} /> Preview & Validate
                </button>
                <button onClick={uploadFile} disabled={uploading} className="btn-primary text-xs disabled:opacity-60">
                  {uploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={13} />}
                  {uploading ? 'Uploading...' : 'Import Logs'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Validation results */}
        {validation && (
          <div className="card animate-fade-in">
            <h3 className="font-bold text-charcoal font-display mb-4">Validation Results</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 bg-slate-50 border border-border rounded-lg px-3 py-2">
                <span className="text-xs text-muted">Total Rows</span>
                <span className="font-bold text-charcoal">{validation.total_rows}</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle size={13} className="text-emerald-600" />
                <span className="text-xs text-emerald-700">Valid</span>
                <span className="font-bold text-emerald-700">{validation.valid_rows}</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <X size={13} className="text-red-600" />
                <span className="text-xs text-red-700">Errors</span>
                <span className="font-bold text-red-700">{validation.error_rows}</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="text-amber-600" />
                <span className="text-xs text-amber-700">Duplicates</span>
                <span className="font-bold text-amber-700">{validation.duplicate_rows}</span>
              </div>
            </div>
            {validation.errors?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Issues Found</p>
                <div className="space-y-1.5">
                  {validation.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-red-500">Row {e.row}</span>
                      <span className="text-xs text-red-700">{e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <UploadHistory />
      </div>
    </Layout>
  )
}
