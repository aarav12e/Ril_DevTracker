import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { trackBadge } from '../../utils/badges'
import { TRACKS } from '../../constants'
import { Search, ClipboardList, User } from 'lucide-react'

const STATUSES = ['pending', 'in_progress', 'completed', 'on_hold', 'fut']

function statusBadgeClass(s) {
  return {
    completed:   'badge-green',
    in_progress: 'badge-amber',
    pending:     'badge-gray',
    on_hold:     'badge-red',
    fut:         'badge-purple',
  }[s] || 'badge-gray'
}

export default function AdminLogs() {
  const [tasks, setTasks]         = useState([])
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [trackFilter, setTrackFilter]   = useState('')
  const [devFilter, setDevFilter]       = useState('')

  // Fetch all developers/interns once for the dropdown
  useEffect(() => {
    api.get('/api/users', { params: { limit: 200 } })
      .then(r => setDevelopers((r.data || []).filter(u => ['developer', 'intern'].includes(u.role))))
      .catch(() => {})
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = { limit: 200 }
      if (statusFilter) params.status  = statusFilter
      if (trackFilter)  params.track   = trackFilter
      if (devFilter)    params.user_id = devFilter
      const { data } = await api.get('/api/tasks', { params })
      setTasks(data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchTasks() }, [statusFilter, trackFilter, devFilter])

  const filtered = tasks.filter(t =>
    !search ||
    t.task_title?.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.developer_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="All Development Logs" subtitle="Complete log history across all developers">
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9 w-56 text-sm"
              placeholder="Search ticket or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Developer filter */}
          <div className="relative flex items-center">
            <User size={13} className="absolute left-2.5 text-muted pointer-events-none" />
            <select
              className="select pl-8 w-44 text-sm"
              value={devFilter}
              onChange={e => setDevFilter(e.target.value)}
            >
              <option value="">All Developers</option>
              {developers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name || d.username}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <select className="select w-36 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s === 'fut' ? 'FUT' : s.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Track filter */}
          <select className="select w-36 text-sm" value={trackFilter} onChange={e => setTrackFilter(e.target.value)}>
            <option value="">All Tracks</option>
            {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <span className="text-xs text-muted">{filtered.length} logs</span>
      </div>

      {/* Developer badge — show when filtered */}
      {devFilter && (() => {
        const dev = developers.find(d => String(d.id) === String(devFilter))
        return dev ? (
          <div className="mb-4 flex items-center gap-2 bg-forest-50 border border-forest-200 rounded-lg px-4 py-2.5">
            <div className="w-7 h-7 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-bold">
              {(dev.full_name || dev.username)[0].toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-forest-700">
              Showing logs for: {dev.full_name || dev.username}
            </span>
            <span className="ml-1 text-xs text-forest-500 capitalize">({dev.role})</span>
            <button
              onClick={() => setDevFilter('')}
              className="ml-auto text-xs text-forest-600 hover:underline"
            >
              Clear
            </button>
          </div>
        ) : null
      })()}

      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  {['Ticket', 'Developer', 'Track', 'Subject', 'CD', 'Type', 'Status', 'Priority', 'Time (Min)', 'Source', 'Date'].map(h => (
                    <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <EmptyState icon={ClipboardList} message="No logs found" colSpan={11} />
                ) : filtered.map(t => {
                  const totalMins = Math.round((t.total_seconds || 0) / 60)
                  return (
                    <tr key={t.id} className={`table-row ${t.track === 'PROD' ? 'bg-red-50/30' : ''}`}>
                      <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-forest-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                            {(t.developer_name || 'S')[0].toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-charcoal whitespace-nowrap">{t.developer_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="table-cell">{trackBadge(t.track)}</td>
                      <td className="table-cell min-w-[220px] max-w-[340px] whitespace-normal break-words font-medium text-charcoal">{t.task_title}</td>
                      <td className="table-cell text-xs text-muted min-w-[120px] whitespace-normal break-words">{t.cd_number || '—'}</td>
                      <td className="table-cell text-xs text-muted min-w-[140px] whitespace-normal break-words">{t.type_of_development || '—'}</td>
                      <td className="table-cell">
                        <span className={statusBadgeClass(t.status)}>
                          {t.status === 'fut' ? 'FUT' : t.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${t.priority === 'high' ? 'badge-red' : t.priority === 'medium' ? 'badge-amber' : 'badge-gray'} capitalize`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-forest-600 whitespace-nowrap">{totalMins} min</td>
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



