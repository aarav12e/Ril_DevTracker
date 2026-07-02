import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import KpiCard from '../../components/shared/KpiCard'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import { statusBadge, trackBadge } from '../../utils/badges'
import { STATUS_COLORS, TRACK_COLORS } from '../../constants'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, Clock, CheckCircle, AlertCircle, TrendingUp, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/dashboard/admin'),
      api.get('/api/tasks?limit=10'),
    ])
      .then(([a, t]) => { setData(a.data); setTasks(t.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Layout title="Dashboard Overview">
      <LoadingSpinner />
    </Layout>
  )

  const devChartData = (data?.developer_breakdown || []).slice(0, 8).map(d => ({
    name: d.username?.split('_')[0] || d.username,
    hours: d.total_hours,
    tasks: d.task_count,
  }))

  const statusData = Object.entries(data?.status_breakdown || {}).map(([name, value]) => ({ name, value }))

  return (
    <Layout title="Dashboard Overview" subtitle={`Week Overview · ${data?.week_label || ''}`}>
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Users}       label="Total Users"     value={data?.kpis?.total_users || 0}                color="forest" sub="Active accounts" />
        <KpiCard icon={Clock}       label="Hours This Week" value={`${data?.kpis?.total_hours_this_week || 0}h`} color="blue"   sub="All developers" />
        <KpiCard icon={AlertCircle} label="In Progress"     value={data?.kpis?.in_progress_this_week || 0}      color="amber"  sub="Active tasks" />
        <KpiCard icon={CheckCircle} label="Completed"       value={data?.kpis?.completed_this_week || 0}        color="forest" sub="This week" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-charcoal font-display">Developer Hours — This Week</h3>
              <p className="text-xs text-muted mt-0.5">Hours logged per developer</p>
            </div>
            <TrendingUp size={18} className="text-forest-600" />
          </div>
          {devChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={devChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                  formatter={v => [`${v}h`, 'Hours']}
                />
                <Bar dataKey="hours" fill="#0D4F3C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted text-sm">No data yet — logs will appear here</div>
          )}
        </div>

        {/* Donut chart */}
        <div className="card">
          <div className="mb-5">
            <h3 className="font-bold text-charcoal font-display">Task Status</h3>
            <p className="text-xs text-muted mt-0.5">Breakdown by status</p>
          </div>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted text-sm">No tasks yet</div>
          )}
        </div>
      </div>

      {/* Recent logs table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-charcoal font-display">Recent Development Logs</h3>
            <p className="text-xs text-muted mt-0.5">Latest activity across all developers</p>
          </div>
          <Activity size={18} className="text-forest-600" />
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {['Ticket', 'Developer', 'Subject', 'Track', 'Type', 'Status', 'Date', 'Hours'].map(h => (
                  <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <EmptyState colSpan={8} message="No logs yet. Developers can start adding tasks." />
              ) : tasks.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell"><span className="ticket">{t.ticket_id || '—'}</span></td>
                  <td className="table-cell font-medium">{t.developer_name || 'System'}</td>
                  <td className="table-cell max-w-[180px] truncate">{t.task_title}</td>
                  <td className="table-cell">{trackBadge(t.track)}</td>
                  <td className="table-cell text-muted text-xs">{t.type_of_development || '—'}</td>
                  <td className="table-cell">{statusBadge(t.status)}</td>
                  <td className="table-cell text-muted text-xs">{t.start_date || '—'}</td>
                  <td className="table-cell font-semibold text-forest-600">{t.hours_logged || 0}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
