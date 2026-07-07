import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { statusClass, trackBadge } from '../../utils/badges'
import { TRACKS } from '../../constants'
import { Download, BarChart2, RefreshCw, User, Calendar, Trash2, CalendarOff } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

const STATUSES = ['in_progress', 'fut', 'completed', 'hold_functional', 'hold_developer']
const STATUS_LABELS = {
  in_progress: 'WIP',
  fut: 'FUT',
  completed: 'PROD',
  hold_functional: 'Hold – Functional',
  hold_developer: 'Hold – Developer',
  // legacy
  pending: 'Pending',
  on_hold: 'Hold',
}

export default function Reports() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === 'admin' || user?.role === 'manager'
  const [tasks, setTasks] = useState([])
  const [search, setSearch] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [developers, setDevelopers] = useState([])
  const [filters, setFilters] = useState({ from_date: '', to_date: '', status: '', track: '', user_id: '' })
  const set = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  // Leaves state
  const [activeTab, setActiveTab] = useState('logs') // 'logs' | 'leaves'
  const [leavesList, setLeavesList] = useState([])
  const [leavesLoading, setLeavesLoading] = useState(false)

  // Fetch all developers/interns for dropdown
  useEffect(() => {
    if (isAdmin) {
      api.get('/api/users', { params: { limit: 200 } })
        .then(r => setDevelopers((r.data || []).filter(u => ['developer', 'intern'].includes(u.role))))
        .catch(() => {})
    }
  }, [isAdmin])

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

  const fetchLeaves = async () => {
    if (!isAdmin) return
    setLeavesLoading(true)
    try {
      const { data } = await api.get('/api/leaves')
      setLeavesList(data || [])
    } catch {} finally { setLeavesLoading(false) }
  }

  useEffect(() => {
    fetchReports()
    if (isAdmin) {
      fetchLeaves()
    }
  }, [isAdmin])

  const resetFilters = () => {
    const empty = { from_date: '', to_date: '', status: '', track: '', user_id: '' }
    setFilters(empty)
    setSearch('')
    fetchReports(empty)
    fetchLeaves()
  }

  const deleteLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete/cancel this leave record?')) return
    try {
      await api.delete(`/api/leaves/${leaveId}`)
      toast.success('Leave record deleted')
      fetchLeaves()
    } catch {
      toast.error('Failed to delete leave record')
    }
  }

  const exportExcel = async () => {
    try {
      const params = {}
      if (filters.from_date) params.from_date = filters.from_date
      if (filters.to_date)   params.to_date   = filters.to_date
      if (filters.status)    params.status    = filters.status
      if (filters.track)     params.track     = filters.track
      if (filters.user_id)   params.user_id   = filters.user_id
      const res = await api.get('/api/config/export/excel', { params, responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = 'devtracker_export.xlsx'; a.click()
    } catch { toast.error('Export failed') }
  }

  const exportCSV = async () => {
    try {
      const params = {}
      if (filters.from_date) params.from_date = filters.from_date
      if (filters.to_date)   params.to_date   = filters.to_date
      if (filters.status)    params.status    = filters.status
      if (filters.track)     params.track     = filters.track
      if (filters.user_id)   params.user_id   = filters.user_id
      const res = await api.get('/api/config/export/csv', { params, responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = 'devtracker_export.csv'; a.click()
    } catch { toast.error('Export failed') }
  }

  const filteredTasks = tasks.filter(t =>
    !search ||
    t.task_title?.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.developer_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.cd_number?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredLeaves = leavesList.filter(l => {
    if (filters.user_id && String(l.user_id) !== String(filters.user_id)) return false
    if (filters.from_date && l.from_date < filters.from_date) return false
    if (filters.to_date && l.to_date > filters.to_date) return false
    if (search) {
      const term = search.toLowerCase()
      return (
        l.developer_name?.toLowerCase().includes(term) ||
        l.reason?.toLowerCase().includes(term)
      )
    }
    return true
  })

  return (
    <Layout title="Reports & Export" subtitle="Filter, analyze and export development logs">

      {/* ── Horizontal Filter Bar ── */}
      <div className="card mb-5">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search Bar */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide">Search</label>
            <input
              type="text"
              placeholder="Search by subject, ticket, developer, CD..."
              className="input text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

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
              {STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </div>

          {/* Developer */}
          {isAdmin && (
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
          )}

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

      {/* ── Tabs Switcher ── */}
      {isAdmin && (
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1.5 rounded-xl mb-5 w-fit">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'logs' ? 'bg-[#0D4F3C] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Task Logs
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'leaves' ? 'bg-[#0D4F3C] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Developer Leaves
          </button>
        </div>
      )}

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

      {(activeTab === 'logs' || !isAdmin) ? (
        /* ── Full-width Table ── */
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
                    {[
                      'Sr No.', 'Track', 'Dev Type', 'Module', 'Type of Development',
                      'ProjectID / CCB ID / CD No.', 'Development Subject', 'Category',
                      'Development Description', 'Functional Team', 'Developer Name',
                      'Start Date', 'End Date', 'Status', 'Remarks', 'Time (Min)'
                    ].map(h => (
                      <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr><td colSpan={16} className="table-cell text-center py-12 text-muted">No logs match your filters</td></tr>
                  ) : filteredTasks.map(t => {
                    const totalMins = t.total_seconds
                      ? Math.round(t.total_seconds / 60)
                      : Math.round((t.hours_logged || 0) * 60)
                    return (
                      <tr key={t.ticket_id} className="table-row hover:bg-forest-50/30">
                        <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                        <td className="table-cell">{trackBadge(t.track)}</td>
                        <td className="table-cell text-xs text-muted whitespace-nowrap">{t.dev_type || '—'}</td>
                        <td className="table-cell text-xs text-muted whitespace-nowrap">{t.module || '—'}</td>
                        <td className="table-cell text-xs text-muted min-w-[140px] whitespace-normal break-words">{t.type_of_development || '—'}</td>
                        <td className="table-cell text-xs text-muted min-w-[120px] whitespace-normal break-words">{t.cd_number || '—'}</td>
                        <td className="table-cell min-w-[200px] max-w-[300px] whitespace-normal break-words font-semibold text-charcoal">{t.task_title}</td>
                        <td className="table-cell text-xs text-muted whitespace-nowrap">{t.category || '—'}</td>
                        <td className="table-cell text-xs text-muted min-w-[160px] max-w-[240px] whitespace-normal break-words">{t.description || '—'}</td>
                        <td className="table-cell text-xs text-muted min-w-[100px] whitespace-normal break-words">{t.functional_team || '—'}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-forest-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                              {(t.developer_name || 'S')[0].toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-charcoal whitespace-nowrap">{t.developer_name || 'System'}</span>
                          </div>
                        </td>
                        <td className="table-cell text-xs text-muted whitespace-nowrap">{t.start_date || '—'}</td>
                        <td className="table-cell text-xs text-muted whitespace-nowrap">{t.due_date || '—'}</td>
                        <td className="table-cell">
                          <span className={statusClass(t.status)}>
                            {STATUS_LABELS[t.status] || t.status}
                          </span>
                        </td>
                        <td className="table-cell text-xs text-muted min-w-[160px] max-w-[240px] whitespace-normal break-words">{t.remarks || '—'}</td>
                        <td className="table-cell font-semibold text-forest-600 text-right">{totalMins} min</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ── Leaves History View ── */
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0D4F3C] font-display flex items-center gap-2">
              <Calendar size={18} className="text-[#0D4F3C]" /> Developer Leave Applications
            </h3>
          </div>

          {leavesLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    {['Sr No.', 'Developer Name', 'From Date', 'To Date', 'Reason', 'Total Leave Days', 'Applied At', 'Actions'].map(h => (
                      <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.length === 0 ? (
                    <EmptyState
                      icon={CalendarOff}
                      message="No leave records match your filters"
                      colSpan={8}
                    />
                  ) : filteredLeaves.map((l, i) => (
                    <tr key={l.id} className="table-row">
                      <td className="table-cell font-mono text-xs">{i + 1}</td>
                      <td className="table-cell font-semibold text-charcoal">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-forest-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                            {(l.developer_name || 'D')[0].toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-charcoal whitespace-nowrap">{l.developer_name}</span>
                        </div>
                      </td>
                      <td className="table-cell font-semibold text-charcoal">{l.from_date}</td>
                      <td className="table-cell font-semibold text-charcoal">{l.to_date}</td>
                      <td className="table-cell max-w-sm truncate text-slate-600" title={l.reason}>{l.reason}</td>
                      <td className="table-cell">
                        <span className="bg-forest-50 text-[#0D4F3C] text-xs font-bold px-2 py-0.5 rounded border border-forest-200">
                          {l.total_days} weekday{l.total_days > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-muted">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <button onClick={() => deleteLeave(l.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 transition-colors" title="Delete Leave Application">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

