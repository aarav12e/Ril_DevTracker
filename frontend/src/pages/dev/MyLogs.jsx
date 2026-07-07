import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { statusBadge, timerBadge, trackBadge } from '../../utils/badges'
import { Plus, Search, Play, CheckCircle, ClipboardList, Edit2, Calendar, Trash2, CalendarOff } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [['', 'All'], ['pending', 'Pending'], ['in_progress', 'WIP'], ['completed', 'Done'], ['on_hold', 'Hold']]

export default function MyLogs() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Leaves state
  const [activeTab, setActiveTab] = useState('logs') // 'logs' | 'leaves'
  const [leavesList, setLeavesList] = useState([])
  const [leavesLoading, setLeavesLoading] = useState(false)

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/api/tasks/my', { params })
      setTasks(data)
    } catch {} finally { setLoading(false) }
  }

  const fetchLeaves = async () => {
    setLeavesLoading(true)
    try {
      const { data } = await api.get('/api/leaves/my')
      setLeavesList(data)
    } catch {} finally { setLeavesLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchTasks()
    } else {
      fetchLeaves()
    }
  }, [statusFilter, activeTab])

  const timerAction = async (action, id) => {
    try { await api.post(`/api/timer/${action}/${id}`); fetchTasks() }
    catch (e) { toast.error(e.response?.data?.detail || 'Error') }
  }

  const deleteLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return
    try {
      await api.delete(`/api/leaves/${leaveId}`)
      toast.success('Leave request cancelled')
      fetchLeaves()
    } catch (err) {
      toast.error('Failed to cancel leave request')
    }
  }

  const filteredTasks = tasks.filter(t =>
    !search ||
    t.task_title?.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="My Logs" subtitle="Your complete task history">
      
      {/* ── Tabs Switcher ── */}
      <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1.5 rounded-xl mb-5 w-fit">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'logs' ? 'bg-[#0D4F3C] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          My Task Logs
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'leaves' ? 'bg-[#0D4F3C] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          My Leave History
        </button>
      </div>

      {activeTab === 'logs' ? (
        /* ── Task Logs View ── */
        <>
          {/* Filter bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
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
                      statusFilter === val ? 'bg-[#0D4F3C] text-white' : 'text-muted hover:text-charcoal'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  api.get('/api/config/export/excel', { responseType: 'blob' })
                    .then(res => {
                      const url = URL.createObjectURL(res.data)
                      const a = document.createElement('a'); a.href = url; a.download = 'my_logs.xlsx'; a.click()
                    })
                    .catch(() => {})
                }}
                className="btn-outline text-xs px-3 py-1.5"
              >
                ↓ Export
              </button>
              <button onClick={() => navigate('/dev/add')} className="btn-primary text-xs px-3.5 py-1.5">
                <Plus size={15} /> New Log
              </button>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="card">
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
                        'Start Date', 'End Date', 'Status', 'Remarks', 'Timer', 'Time (Min)', 'Actions'
                      ].map(h => (
                        <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <EmptyState
                        icon={ClipboardList}
                        message="No logs yet"
                        sub='Click "New Log" to create your first task'
                        colSpan={18}
                      />
                    ) : filteredTasks.map(t => {
                      const totalMins = Math.round((t.total_seconds || 0) / 60)
                      return (
                        <tr key={t.id} className={`table-row ${t.timer_status === 'active' ? 'bg-emerald-50/40' : ''} ${t.track === 'PROD' ? 'bg-red-50/20' : ''}`}>
                          <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                          <td className="table-cell">{trackBadge(t.track)}</td>
                          <td className="table-cell text-xs text-muted whitespace-nowrap">{t.dev_type_task || '—'}</td>
                          <td className="table-cell text-xs text-muted whitespace-nowrap">{t.module || '—'}</td>
                          <td className="table-cell text-xs text-muted min-w-[140px] whitespace-normal break-words">{t.type_of_development || '—'}</td>
                          <td className="table-cell text-xs text-muted min-w-[120px] whitespace-normal break-words">{t.cd_number || '—'}</td>
                          <td className="table-cell min-w-[200px] max-w-[300px] whitespace-normal break-words font-semibold text-charcoal">{t.task_title}</td>
                          <td className="table-cell text-xs text-muted whitespace-nowrap">{t.category || '—'}</td>
                          <td className="table-cell text-xs text-muted min-w-[160px] max-w-[240px] whitespace-normal break-words">{t.description || '—'}</td>
                          <td className="table-cell text-xs text-muted min-w-[100px] whitespace-normal break-words">{t.functional_team || '—'}</td>
                          <td className="table-cell text-xs text-muted whitespace-nowrap">{t.developer_name || 'System'}</td>
                          <td className="table-cell text-xs text-muted whitespace-nowrap">{t.start_date || '—'}</td>
                          <td className="table-cell text-xs text-muted whitespace-nowrap">{t.due_date || '—'}</td>
                          <td className="table-cell">{statusBadge(t.status)}</td>
                          <td className="table-cell text-xs text-muted min-w-[160px] max-w-[240px] whitespace-normal break-words">{t.remarks || '—'}</td>
                          <td className="table-cell">{timerBadge(t.timer_status)}</td>
                          <td className="table-cell font-semibold text-forest-600 whitespace-nowrap text-right">{totalMins} min</td>
                          <td className="table-cell">
                            <div className="flex items-center gap-1">
                              <button onClick={() => navigate(`/dev/edit/${t.id}`)}
                                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors" title="Edit Log">
                                <Edit2 size={12} />
                              </button>
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
              <p className="text-xs text-muted">Showing {filteredTasks.length} of {tasks.length} logs</p>
            </div>
          </div>
        </>
      ) : (
        /* ── Leaves History View ── */
        <>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-700 font-display flex items-center gap-2">
              <Calendar size={18} className="text-[#0D4F3C]" /> My Leave Applications
            </h3>
            <button onClick={() => navigate('/dev/add')} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5">
              <Calendar size={13} /> Request Leave
            </button>
          </div>

          <div className="card">
            {leavesLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      {['Sr No.', 'From Date', 'To Date', 'Reason', 'Total Leave Days', 'Applied At', 'Actions'].map(h => (
                        <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leavesList.length === 0 ? (
                      <EmptyState
                        icon={CalendarOff}
                        message="No leave applications yet"
                        sub="You haven't requested any leaves"
                        colSpan={7}
                      />
                    ) : leavesList.map((l, i) => (
                      <tr key={l.id} className="table-row">
                        <td className="table-cell font-mono text-xs">{i + 1}</td>
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
                          <button onClick={() => deleteLeave(l.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 transition-colors" title="Cancel Request">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted">Showing {leavesList.length} leave requests</p>
            </div>
          </div>
        </>
      )}

    </Layout>
  )
}
