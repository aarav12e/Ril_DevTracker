import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { statusClass, trackBadge } from '../../utils/badges'
import { TRACKS } from '../../constants'
import { Download, Filter, BarChart2 } from 'lucide-react'

export default function Reports() {
  const [tasks, setTasks] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ from_date: '', to_date: '', status: '', track: '' })
  const set = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.from_date) params.from_date = filters.from_date
      if (filters.to_date)   params.to_date   = filters.to_date
      if (filters.status)    params.status    = filters.status
      if (filters.track)     params.track     = filters.track
      const { data } = await api.get('/api/analytics/reports', { params })
      setTasks(data.tasks || [])
      setSummary({ total: data.total_tasks, hours: data.total_hours, avg: data.avg_hours_per_task })
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchReports() }, [])

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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} className="btn-primary text-sm">
            <Download size={15} /> Export Excel
          </button>
          <button onClick={exportCSV} className="btn-outline text-sm">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Filter panel */}
        <div className="card h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-charcoal font-display flex items-center gap-2">
              <Filter size={15} /> Filter Logs
            </h3>
            <button
              onClick={() => { setFilters({ from_date: '', to_date: '', status: '', track: '' }); fetchReports() }}
              className="text-xs text-forest-600 hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">From Date</label>
              <input type="date" className="input text-sm" value={filters.from_date} onChange={e => set('from_date', e.target.value)} />
            </div>
            <div>
              <label className="label">To Date</label>
              <input type="date" className="input text-sm" value={filters.to_date} onChange={e => set('to_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select text-sm" value={filters.status} onChange={e => set('status', e.target.value)}>
                <option value="">All Status</option>
                {['pending', 'in_progress', 'completed', 'on_hold'].map(s => (
                  <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Track</label>
              <select className="select text-sm" value={filters.track} onChange={e => set('track', e.target.value)}>
                <option value="">All Tracks</option>
                {TRACKS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={fetchReports} className="btn-primary w-full justify-center text-sm">
              Apply Filters
            </button>
            {summary && (
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted">Total Logs</span><span className="font-bold text-charcoal">{summary.total}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Total Hours</span><span className="font-bold text-forest-600">{summary.hours}h</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Avg / Log</span><span className="font-bold text-charcoal">{summary.avg}h</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-charcoal font-display flex items-center gap-2">
              <BarChart2 size={16} className="text-forest-600" /> Filtered Logs
            </h3>
            {summary && <span className="text-xs text-muted">Showing {tasks.length} results</span>}
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    {['Ticket', 'Subject', 'Track', 'Dev Type', 'Status', 'Hours', 'Date'].map(h => (
                      <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr><td colSpan={7} className="table-cell text-center py-12 text-muted">No logs match your filters</td></tr>
                  ) : tasks.map(t => (
                    <tr key={t.ticket_id} className="table-row hover:bg-forest-50/30">
                      <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                      <td className="table-cell max-w-[180px] truncate font-medium">{t.task_title}</td>
                      <td className="table-cell">{trackBadge(t.track)}</td>
                      <td className="table-cell text-xs text-muted">{t.dev_type || '—'}</td>
                      <td className="table-cell">
                        <span className={statusClass(t.status)}>{t.status?.replace('_', ' ')}</span>
                      </td>
                      <td className="table-cell font-semibold text-forest-600">{t.hours_logged}h</td>
                      <td className="table-cell text-xs text-muted">{t.start_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
