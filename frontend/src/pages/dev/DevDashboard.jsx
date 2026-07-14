import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { SkeletonDevDashboard } from '../../components/shared/Skeleton'
import LiveTimer from '../../components/task/LiveTimer'
import TaskCard from '../../components/task/TaskCard'
import QuickAddForm from '../../components/task/QuickAddForm'
import { statusBadge, trackBadge } from '../../utils/badges'
import { Plus, Clock, Zap, ListChecks, Timer, Play, CheckCircle } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

export default function DevDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [dashData, setDashData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    try {
      const [d, t] = await Promise.all([
        api.get('/api/analytics/dashboard/me'),
        api.get('/api/tasks/my'),
      ])
      setDashData(d.data)
      setTasks(t.data)
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const timerAction = async (action, taskId) => {
    try {
      await api.post(`/api/timer/${action}/${taskId}`)
      fetchAll()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Timer error')
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  const activeTasks  = tasks.filter(t => t.timer_status === 'active' || t.timer_status === 'paused')
  const idleTasks    = tasks.filter(t => t.timer_status === 'idle' && t.status !== 'completed' && t.status !== 'done').slice(0, 3)
  const recentTasks  = tasks.slice(0, 10)

  const todayMins = Math.round((dashData?.kpis?.total_seconds_today || 0) / 60)
  const todayHrs = Math.floor(todayMins / 60)
  const todayRemainingMins = todayMins % 60
  const todayFormatted = todayHrs > 0 ? `${todayHrs}h ${todayRemainingMins}m` : `${todayRemainingMins}m`

  const totalTodaySecs = dashData?.today_breakdown?.reduce((a, t) => a + t.seconds_today, 0) || 0
  const maxSecs        = Math.max(...(dashData?.today_breakdown || []).map(t => t.seconds_today), 1)

  if (loading) return (
    <Layout title="My Dashboard">
      <SkeletonDevDashboard />
    </Layout>
  )

  return (
    <Layout title="My Dashboard">
      {/* Greeting banner */}
      <div
        className="rounded-card mb-6 p-6 flex items-center justify-between overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b52 100%)' }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M20 20.5V18H0v5h5v5H0v5h20v-2.5h10v-5H20zm10 5H30v-5h-9.5V13H20v5H10v5H5v-5H0V8h10V3H0V0h20v2.5h10v5H20V10h10v2.5h5V15h-5v5z'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">
            {greeting()}, {user?.full_name?.split(' ')[0] || user?.username} 👋
          </p>
          {dashData?.active_task ? (
            <>
              <p className="text-white font-bold text-xl font-display">Active: {dashData.active_task.ticket_id}</p>
              <p className="text-white/60 text-sm mt-0.5">{dashData.active_task.task_title}</p>
            </>
          ) : (
            <>
              <p className="text-white font-bold text-xl font-display">No active task</p>
              <p className="text-white/60 text-sm mt-0.5">Start a task to begin tracking time</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {dashData?.active_task && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/70 text-xs">Timer running</span>
              </div>
              <LiveTimer baseSeconds={dashData.active_task.total_seconds || 0} running={true} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Clock,       label: 'Today',       value: todayFormatted,                  sub: 'Logged today', color: 'bg-teal-50 text-teal-700' },
          { icon: Zap,         label: 'Active Task',  value: dashData?.active_task ? dashData.active_task.ticket_id : '—', sub: dashData?.active_task ? 'Timer running' : 'None running', color: 'bg-emerald-50 text-emerald-700' },
          { icon: Timer,       label: 'WIP Tasks',    value: dashData?.kpis?.wip_count || 0,                 sub: `${dashData?.kpis?.paused_count || 0} paused`, color: 'bg-amber-50 text-amber-700' },
          { icon: CheckCircle, label: 'Done Today',   value: dashData?.kpis?.completed_today || 0,            sub: `This week: ${dashData?.kpis?.total_hours_this_week || 0}h`, color: 'bg-forest-50 text-forest-700' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">{label}</p>
                <p className="font-bold text-2xl text-charcoal font-display">{value}</p>
                <p className="text-xs text-muted mt-1">{sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active/paused + idle tasks */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-charcoal font-display">My Tasks</h3>
            <p className="text-xs text-muted mt-0.5">Only one task can run at a time — switching auto-pauses the current one</p>
          </div>
          <button onClick={() => navigate('/dev/add')} className="btn-outline text-xs">
            <Plus size={14} /> Start New Task
          </button>
        </div>

        {activeTasks.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Timer size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No active tasks. Start a task to begin the timer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map(t => (
              <TaskCard
                key={t.id} task={t}
                onStart={id  => timerAction('start',   id)}
                onPause={id  => timerAction('pause',   id)}
                onResume={id => timerAction('resume',  id)}
                onComplete={id => timerAction('complete', id)}
                onSwitch={id => timerAction('switch',  id)}
              />
            ))}
          </div>
        )}

        {/* Idle tasks */}
        {idleTasks.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Pending Tasks</p>
            <div className="space-y-2">
              {idleTasks.map(t => (
                <TaskCard key={t.id} task={t}
                  onStart={id  => timerAction('start',   id)}
                  onPause={id  => timerAction('pause',   id)}
                  onResume={id => timerAction('resume',  id)}
                  onComplete={id => timerAction('complete', id)}
                  onSwitch={id => timerAction('switch',  id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two column: time breakdown + quick add */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Time breakdown */}
        <div className="card">
          <h3 className="font-bold text-charcoal font-display mb-1">Today's Time Breakdown</h3>
          <p className="text-xs text-muted mb-4">Time spent per task</p>
          {(dashData?.today_breakdown || []).length === 0 ? (
            <div className="text-center py-6 text-muted text-sm">No time logged today yet</div>
          ) : (
            <div className="space-y-3">
              {(dashData.today_breakdown || []).map(t => {
                const pct  = Math.round((t.seconds_today / maxSecs) * 100)
                const hrs  = Math.floor(t.seconds_today / 3600)
                const mins = Math.floor((t.seconds_today % 3600) / 60)
                return (
                  <div key={t.task_id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="ticket text-[10px]">{t.ticket_id}</span>
                        <span className="text-xs text-charcoal truncate">{t.task_title}</span>
                      </div>
                      <span className="text-xs font-semibold text-forest-600 flex-shrink-0 ml-2">{hrs}h {mins}m</span>
                    </div>
                    <div className="h-2 rounded-full bg-forest-50 overflow-hidden">
                      <div className="h-full rounded-full bg-forest-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 border-t border-border flex justify-between">
                <span className="text-xs font-bold text-muted">Total today</span>
                <span className="text-sm font-bold text-forest-600">
                  {Math.floor(totalTodaySecs / 3600)}h {Math.floor((totalTodaySecs % 3600) / 60)}m
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick add */}
        <div className="card">
          <h3 className="font-bold text-charcoal font-display mb-1">Log New Task</h3>
          <p className="text-xs text-muted mb-4">A unique ticket will be auto-generated</p>
          <QuickAddForm onSuccess={fetchAll} />
        </div>
      </div>

      {/* Recent logs table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-charcoal font-display">All My Logs</h3>
            <p className="text-xs text-muted mt-0.5">Your complete task history</p>
          </div>
          <ListChecks size={18} className="text-forest-600" />
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {['Ticket', 'Track', 'Subject', 'Type', 'Status', 'Time', 'Timer', 'Actions'].map(h => (
                  <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTasks.length === 0 ? (
                <tr><td colSpan={8} className="table-cell text-center text-muted py-8">No tasks yet — start one above!</td></tr>
              ) : recentTasks.map(t => {
                const hrs  = Math.floor((t.total_seconds || 0) / 3600)
                const mins = Math.floor(((t.total_seconds || 0) % 3600) / 60)
                return (
                  <tr key={t.id} className={`table-row ${t.timer_status === 'active' ? 'bg-emerald-50/30' : ''} ${t.track === 'PROD' ? 'bg-red-50/20' : ''}`}>
                    <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                    <td className="table-cell">{trackBadge(t.track)}</td>
                    <td className="table-cell max-w-[160px] truncate font-medium text-charcoal">{t.task_title}</td>
                    <td className="table-cell text-xs text-muted">{t.type_of_development || '—'}</td>
                    <td className="table-cell">{statusBadge(t.status)}</td>
                    <td className="table-cell font-semibold text-forest-600">{hrs}h {mins}m</td>
                    <td className="table-cell">
                      {t.timer_status === 'active'
                        ? <span className="flex items-center gap-1 text-emerald-600 text-xs"><span className="status-active" />Live</span>
                        : t.timer_status === 'paused'
                        ? <span className="flex items-center gap-1 text-amber-600 text-xs"><span className="status-paused" />Paused</span>
                        : <span className="text-muted text-xs">—</span>
                      }
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {t.timer_status === 'paused' && (
                          <button onClick={() => timerAction('resume', t.id)}
                            className="w-7 h-7 rounded-lg hover:bg-forest-50 flex items-center justify-center text-forest-600 transition-colors" title="Resume">
                            <Play size={13} />
                          </button>
                        )}
                        {t.timer_status === 'idle' && (
                          <button onClick={() => timerAction('start', t.id)}
                            className="w-7 h-7 rounded-lg hover:bg-forest-50 flex items-center justify-center text-forest-600 transition-colors" title="Start">
                            <Play size={13} />
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
      </div>
    </Layout>
  )
}
