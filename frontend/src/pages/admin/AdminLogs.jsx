import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { trackBadge } from '../../utils/badges'
import { TRACKS } from '../../constants'
import { Search, ClipboardList } from 'lucide-react'

const STATUSES = ['pending', 'in_progress', 'completed', 'on_hold']

function statusBadgeClass(s) {
  return { completed: 'badge-green', in_progress: 'badge-amber', pending: 'badge-gray', on_hold: 'badge-red' }[s] || 'badge-gray'
}

export default function AdminLogs() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [trackFilter, setTrackFilter] = useState('')

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (statusFilter) params.status = statusFilter
      if (trackFilter) params.track = trackFilter
      const { data } = await api.get('/api/tasks', { params })
      setTasks(data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchTasks() }, [statusFilter, trackFilter])

  const filtered = tasks.filter(t =>
    !search ||
    t.task_title?.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="All Development Logs" subtitle="Complete log history across all developers">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9 w-56 text-sm"
              placeholder="Search ticket or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="select w-36 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="select w-36 text-sm" value={trackFilter} onChange={e => setTrackFilter(e.target.value)}>
            <option value="">All Tracks</option>
            {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <span className="text-xs text-muted">{filtered.length} logs</span>
      </div>

      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  {['Ticket', 'Developer', 'Track', 'Subject', 'CD', 'Type', 'Status', 'Priority', 'Hours', 'Source', 'Date'].map(h => (
                    <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <EmptyState icon={ClipboardList} message="No logs found" colSpan={11} />
                ) : filtered.map(t => {
                  const hrs  = Math.floor((t.total_seconds || 0) / 3600)
                  const mins = Math.floor(((t.total_seconds || 0) % 3600) / 60)
                  return (
                    <tr key={t.id} className={`table-row ${t.track === 'PROD' ? 'bg-red-50/30' : ''}`}>
                      <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                      <td className="table-cell text-sm font-medium text-charcoal">#{t.user_id}</td>
                      <td className="table-cell">{trackBadge(t.track)}</td>
                      <td className="table-cell max-w-[160px] truncate font-medium text-charcoal">{t.task_title}</td>
                      <td className="table-cell text-xs text-muted">{t.cd_number || '—'}</td>
                      <td className="table-cell text-xs text-muted whitespace-nowrap">{t.type_of_development || '—'}</td>
                      <td className="table-cell">
                        <span className={statusBadgeClass(t.status)}>{t.status?.replace('_', ' ')}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${t.priority === 'high' ? 'badge-red' : t.priority === 'medium' ? 'badge-amber' : 'badge-gray'} capitalize`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-forest-600 whitespace-nowrap">{hrs}h {mins}m</td>
                      <td className="table-cell">
                        <span className={t.upload_source === 'excel' ? 'badge-blue' : 'badge-gray'}>{t.upload_source}</span>
                      </td>
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
