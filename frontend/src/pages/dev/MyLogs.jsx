import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { statusBadge, timerBadge, trackBadge } from '../../utils/badges'
import { Plus, Search, Play, CheckCircle, ClipboardList } from 'lucide-react'

const STATUS_TABS = [['', 'All'], ['pending', 'Pending'], ['in_progress', 'WIP'], ['completed', 'Done'], ['on_hold', 'Hold']]

export default function MyLogs() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/api/tasks/my', { params })
      setTasks(data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchTasks() }, [statusFilter])

  const timerAction = async (action, id) => {
    try { await api.post(`/api/timer/${action}/${id}`); fetchTasks() }
    catch (e) { alert(e.response?.data?.detail || 'Error') }
  }

  const filtered = tasks.filter(t =>
    !search ||
    t.task_title?.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="My Logs" subtitle="Your complete task history">
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9 w-64 text-sm"
              placeholder="Search by subject or ticket..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
            {STATUS_TABS.map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === val ? 'bg-forest-600 text-white' : 'text-muted hover:text-charcoal'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => navigate('/dev/add')} className="btn-primary">
          <Plus size={15} /> New Log
        </button>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  {['Ticket', 'Track', 'Development Subject', 'Type', 'CD', 'Team', 'Status', 'Timer', 'Hours', 'Actions'].map(h => (
                    <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    message="No logs yet"
                    sub='Click "New Log" to create your first task'
                    colSpan={10}
                  />
                ) : filtered.map(t => {
                  const hrs  = Math.floor((t.total_seconds || 0) / 3600)
                  const mins = Math.floor(((t.total_seconds || 0) % 3600) / 60)
                  return (
                    <tr key={t.id} className={`table-row ${t.timer_status === 'active' ? 'bg-emerald-50/40' : ''} ${t.track === 'PROD' ? 'bg-red-50/20' : ''}`}>
                      <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                      <td className="table-cell">{trackBadge(t.track)}</td>
                      <td className="table-cell max-w-[200px]">
                        <p className="font-semibold text-charcoal text-sm truncate">{t.task_title}</p>
                        {t.description && <p className="text-xs text-muted truncate">{t.description}</p>}
                      </td>
                      <td className="table-cell text-xs text-muted whitespace-nowrap">{t.type_of_development || '—'}</td>
                      <td className="table-cell text-xs text-muted">{t.cd_number || '—'}</td>
                      <td className="table-cell text-xs text-muted">{t.functional_team || '—'}</td>
                      <td className="table-cell">{statusBadge(t.status)}</td>
                      <td className="table-cell">{timerBadge(t.timer_status)}</td>
                      <td className="table-cell font-semibold text-forest-600 whitespace-nowrap">{hrs}h {mins}m</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {t.timer_status === 'idle' && (
                            <button onClick={() => timerAction('start', t.id)}
                              className="w-7 h-7 rounded-lg hover:bg-forest-50 flex items-center justify-center text-forest-600 transition-colors" title="Start">
                              <Play size={12} />
                            </button>
                          )}
                          {t.timer_status === 'paused' && (
                            <button onClick={() => timerAction('resume', t.id)}
                              className="w-7 h-7 rounded-lg hover:bg-forest-50 flex items-center justify-center text-forest-600 transition-colors" title="Resume">
                              <Play size={12} />
                            </button>
                          )}
                          {(t.timer_status === 'active' || t.timer_status === 'paused') && (
                            <button onClick={() => timerAction('complete', t.id)}
                              className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors" title="Complete">
                              <CheckCircle size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted">Showing {filtered.length} of {tasks.length} logs</p>
        </div>
      </div>
    </Layout>
  )
}
