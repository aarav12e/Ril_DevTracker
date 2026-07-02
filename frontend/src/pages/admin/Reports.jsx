import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { statusClass, trackBadge } from '../../utils/badges'
import { TRACKS } from '../../constants'
import { Download, BarChart2, RefreshCw, User } from 'lucide-react'

export default function Reports() {
  const [tasks, setTasks] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [developers, setDevelopers] = useState([])
  const [filters, setFilters] = useState({ from_date: '', to_date: '', status: '', track: '', user_id: '' })
  const set = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  // Fetch all developers/interns for dropdown
  useEffect(() => {
    api.get('/api/users', { params: { limit: 200 } })
      .then(r => setDevelopers((r.data || []).filter(u => ['developer', 'intern'].includes(u.role))))
      .catch(() => {})
  }, [])

  const fetchReports = async (overrideFilters) => {
    setLoading(true)
    try {
      const f = overrideFilters || filters
      const params = {}
      if (f.from_date) params.from_date = f.from_date
      if (f.to_date)   params.to_date   = f.to_date
      if (f.status)    params.status    = f.status
      if (f.track)     params.track     = f.track
      if (f.user_id)   params.user_id   = f.user_id
      const { data } = await api.get('/api/analytics/reports', { params })
      setTasks(data.tasks || [])
      setSummary({ total: data.total_tasks, hours: data.total_hours, avg: data.avg_hours_per_task })
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchReports() }, [])

  const resetFilters = () => {
    const empty = { from_date: '', to_date: '', status: '', track: '', user_id: '' }
    setFilters(empty)
    fetchReports(empty)
  }

  const exportExcel = async () => {
    try {
      const params = {}
      if (filters.from_date) params.from_date = filters.from_date
      if (filters.to_date)   params.to_date   = filters.to_date
      const res = await api.get('/api/config/export/excel', { params, responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = 'devtracker_export.xlsx'; a.click()
    } catch { alert('Export failed') }
  }

  const exportCSV = async () => {
    try {
      const res = await api.get('/api/config/export/csv', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = 'devtracker_export.csv'; a.click()
    } catch { alert('Export failed') }
  }

  return (
    <Layout title="Reports & Export" subtitle="Filter, analyze and export development logs">

      {/* ── Horizontal Filter Bar ── */}
      <div className="card mb-5">
        <div className="flex flex-wrap items-end gap-3">
          {/* From Date */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide">From Date</label>
            <input type="date" className="input text-sm" value={filters.from_date}
              onChange={e => set('from_date', e.target.value)} />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide">To Date</label>
            <input type="date" className="input text-sm" value={filters.to_date}
              onChange={e => set('to_date', e.target.value)} />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide">Status</label>
            <select className="select text-sm" value={filters.status}
              onChange={e => set('status', e.target.value)}>
              <option value="">All Status</option>
              {['pending', 'in_progress', 'completed', 'on_hold', 'fut'].map(s => (
                <option key={s} value={s}>{s === 'fut' ? 'FUT' : s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Developer */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide">Developer</label>
            <div className="relative flex items-center">
              <User size={12} className="absolute left-2.5 text-muted pointer-events-none" />
              <select className="select text-sm pl-7 w-full" value={filters.user_id}
                onChange={e => set('user_id', e.target.value)}>
                <option value="">All Developers</option>
                {developers.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name || d.username}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Track */}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide">Track</label>
            <select className="select text-sm" value={filters.track}
              onChange={e => set('track', e.target.value)}>
              <option value="">All Tracks</option>
              {TRACKS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2 ml-auto flex-wrap">
            <button onClick={resetFilters} className="btn-ghost text-sm text-muted hover:text-charcoal">
              <RefreshCw size={13} /> Reset
            </button>
            <button onClick={() => fetchReports()} className="btn-primary text-sm">
              Apply Filters
            </button>
            <button onClick={exportExcel} className="btn-outline text-sm">
              <Download size={14} /> Excel
            </button>
            <button onClick={exportCSV} className="btn-ghost text-sm">
              <Download size={14} /> CSV
            </button>
          </div>
        </div>

        {/* Summary strip */}
        {summary && (
          <div className="flex flex-wrap items-center gap-6 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted">Total Logs: <strong className="text-charcoal">{summary.total}</strong></span>
            <span className="text-xs text-muted">Total Hours: <strong className="text-forest-600">{summary.hours}h</strong></span>
            <span className="text-xs text-muted">Avg / Log: <strong className="text-charcoal">{summary.avg}h</strong></span>
            <span className="ml-auto text-xs text-muted">{tasks.length} result{tasks.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Developer selected banner */}
      {filters.user_id && (() => {
        const dev = developers.find(d => String(d.id) === String(filters.user_id))
        return dev ? (
          <div className="mb-4 flex items-center gap-2 bg-forest-50 border border-forest-200 rounded-lg px-4 py-2.5">
            <div className="w-7 h-7 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-bold">
              {(dev.full_name || dev.username)[0].toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-forest-700">
              Showing logs for: {dev.full_name || dev.username}
            </span>
            <span className="ml-1 text-xs text-forest-500 capitalize">({dev.role})</span>
            <button onClick={() => set('user_id', '')} className="ml-auto text-xs text-forest-600 hover:underline">
              Clear
            </button>
          </div>
        ) : null
      })()}

      {/* ── Full-width Table ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-charcoal font-display flex items-center gap-2">
            <BarChart2 size={16} className="text-forest-600" /> Filtered Logs
          </h3>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  {['Ticket', 'Developer', 'Subject', 'Track', 'Dev Type', 'Type', 'Status', 'Time (Min)', 'Date'].map(h => (
                    <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={9} className="table-cell text-center py-12 text-muted">No logs match your filters</td></tr>
                ) : tasks.map(t => {
                  // Prefer total_seconds, fall back to hours_logged * 60
                  const totalMins = t.total_seconds
                    ? Math.round(t.total_seconds / 60)
                    : Math.round((t.hours_logged || 0) * 60)
                  return (
                    <tr key={t.ticket_id} className="table-row hover:bg-forest-50/30">
                      <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-forest-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                            {(t.developer_name || 'S')[0].toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-charcoal whitespace-nowrap">{t.developer_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="table-cell min-w-[220px] max-w-[340px] whitespace-normal break-words font-medium text-charcoal">{t.task_title}</td>
                      <td className="table-cell">{trackBadge(t.track)}</td>
                      <td className="table-cell text-xs text-muted">{t.dev_type || '—'}</td>
                      <td className="table-cell text-xs text-muted min-w-[140px] whitespace-normal break-words">{t.type_of_development || '—'}</td>
                      <td className="table-cell">
                        <span className={statusClass(t.status)}>
                          {t.status === 'fut' ? 'FUT' : t.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-forest-600">{totalMins} min</td>
                      <td className="table-cell text-xs text-muted whitespace-nowrap">{t.start_date || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

