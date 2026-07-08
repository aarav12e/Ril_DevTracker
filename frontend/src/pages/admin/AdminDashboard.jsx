import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import KpiCard from '../../components/shared/KpiCard'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { statusBadge, trackBadge } from '../../utils/badges'
import { STATUS_COLORS } from '../../constants'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, Clock, CheckCircle, AlertCircle, TrendingUp,
  RefreshCw, Download, ChevronRight, ChevronDown, Award
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'

export default function AdminDashboard() {
  const { toast } = useToast()
  const [viewType, setViewType] = useState('weekly') // 'weekly' | 'monthly'
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState(null)
  const [productivityData, setProductivityData] = useState(null)
  const [initLoading, setInitLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [expandedDevId, setExpandedDevId] = useState(null)

  const fetchDashboard = async (isFirst = false) => {
    if (isFirst) setInitLoading(true)
    else setFetching(true)
    try {
      if (viewType === 'weekly') {
        const [p, a] = await Promise.all([
          api.get('/api/analytics/weekly-productivity', { params: { offset } }),
          api.get('/api/analytics/dashboard/admin', { params: { view_type: 'weekly', offset } }),
        ])
        setProductivityData(p.data)
        setData(a.data)
      } else {
        const a = await api.get('/api/analytics/dashboard/admin', { params: { view_type: 'monthly', offset } })
        setData(a.data)
        setProductivityData(null)
      }
    } catch {
      toast.error('Failed to fetch dashboard data')
    } finally {
      setInitLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchDashboard(initLoading)
  }, [viewType, offset])

  const handleExportProductivity = () => {
    api.get('/api/analytics/weekly-productivity/export', {
      params: { offset },
      responseType: 'blob'
    })
      .then(res => {
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url
        a.download = `weekly_productivity_offset_${offset}.xlsx`
        a.click()
      })
      .catch(() => toast.error('Excel export failed'))
  }

  if (initLoading) {
    return (
      <Layout title="Dashboard Overview" subtitle="Loading dashboard metrics...">
        <div className="min-h-[400px] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  // Prepare data for developer hours bar chart
  const devChartData = (data?.developer_breakdown || []).map(d => ({
    name: d.full_name || d.username,
    hours: parseFloat(d.total_hours.toFixed(1)),
  }))

  // Prepare data for status breakdown pie chart
  const statusData = Object.entries(data?.status_breakdown || {}).map(([name, value]) => ({
    name: name === 'completed' ? 'PROD' : name === 'in_progress' ? 'WIP' : name.toUpperCase(),
    value,
    statusKey: name,
  }))

  // Calculate totals for productivity sheet view
  const prodItems = productivityData?.data || []
  const totalMins = prodItems.reduce((sum, item) => sum + item.total_minutes, 0)
  const totalTargetMins = prodItems.reduce((sum, item) => sum + (item.target_minutes || 2400), 0)
  const avgProdPct = totalTargetMins > 0 ? Math.round((totalMins / totalTargetMins) * 100) : 0
  const totalLeaves = prodItems.reduce((sum, item) => sum + (item.leave_days || 0), 0)

  return (
    <Layout
      title="Dashboard Overview"
      subtitle={viewType === 'weekly' ? `Overview · ${productivityData?.week_label || ''}` : `Overview · ${data?.week_label || ''}`}
    >
      
      {/* ── View Type Switcher Tabs ── */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => { setViewType('weekly'); setOffset(0); }}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            viewType === 'weekly'
              ? 'border-[#0D4F3C] text-[#0D4F3C]'
              : 'border-transparent text-muted hover:text-charcoal'
          }`}
        >
          Weekly View
        </button>
        <button
          onClick={() => { setViewType('monthly'); setOffset(0); }}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            viewType === 'monthly'
              ? 'border-[#0D4F3C] text-[#0D4F3C]'
              : 'border-transparent text-muted hover:text-charcoal'
          }`}
        >
          Monthly View
        </button>
      </div>

      {/* ── Week/Month switcher control ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-charcoal">
            {viewType === 'weekly' ? 'Weekly Productivity View' : 'Monthly Performance View'}
          </span>
          {fetching && (
            <span className="flex items-center text-xs text-muted ml-2 animate-pulse">
              <RefreshCw size={12} className="animate-spin mr-1" /> Updating...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset(o => o + 1)}
            className="btn-outline text-xs px-3.5 py-2 font-bold"
          >
            ← Previous {viewType === 'weekly' ? 'Week' : 'Month'}
          </button>
          {offset > 0 && (
            <button
              onClick={() => setOffset(0)}
              className="btn-ghost text-xs text-forest-600 hover:underline px-2 py-1.5 font-bold"
            >
              Current {viewType === 'weekly' ? 'Week' : 'Month'}
            </button>
          )}
          <button
            disabled={offset === 0}
            onClick={() => setOffset(o => Math.max(0, o - 1))}
            className="btn-outline text-xs px-3.5 py-2 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
          >
            Next {viewType === 'weekly' ? 'Week' : 'Month'} →
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-opacity ${fetching ? 'opacity-60' : ''}`}>
        <KpiCard icon={Users}       label="Total Users"     value={data?.kpis?.total_users || 0}                color="forest" sub="Active accounts" />
        <KpiCard icon={Clock}       label={`Hours This ${viewType === 'weekly' ? 'Week' : 'Month'}`} value={`${data?.kpis?.total_hours_this_week || 0}h`} color="blue"   sub="All developers" />
        <KpiCard icon={AlertCircle} label="In Progress"     value={data?.kpis?.in_progress_this_week || 0}      color="amber"  sub="Active tasks" />
        <KpiCard icon={CheckCircle} label="Completed"       value={data?.kpis?.completed_this_week || 0}        color="forest" sub={`This ${viewType === 'weekly' ? 'week' : 'month'}`} />
      </div>

      {/* ── Weekly Productivity Sheet Card (Only in Weekly View) ── */}
      {viewType === 'weekly' && (
        <div className="card p-0 overflow-hidden border border-border shadow-md mb-6 animate-in fade-in duration-200">
          
          {/* Sheet Title Bar (Visual Mock of Excel Sheet) */}
          <div className="bg-[#D9E1F2] border-b border-slate-300 p-4 text-center">
            <h2 className="text-base font-bold text-slate-800 leading-tight font-display">
              {productivityData?.week_label}
            </h2>
            <h3 className="text-xs font-bold text-slate-700 mt-0.5 uppercase tracking-wider">
              Developers Weekly (40 hours) productivity
            </h3>
          </div>

          {/* Table Control Bar */}
          <div className="flex items-center justify-between border-b border-border bg-slate-50 px-6 py-3">
            <div className="flex items-center gap-2">
              <Award size={15} className="text-[#0D4F3C]" />
              <span className="text-xs font-semibold text-slate-600">Target is adjusted based on leave days — 40h minus 8h per leave day</span>
            </div>
            <button
              onClick={handleExportProductivity}
              className="btn-outline text-xs px-3.5 py-1.5 flex items-center gap-1.5 border-[#0D4F3C] text-[#0D4F3C] hover:bg-forest-50"
            >
              <Download size={13} /> Export to Excel
            </button>
          </div>

          {/* Excel Sheet Table Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F2F2F2] border-b border-slate-300">
                  <th className="px-6 py-3 text-left font-bold text-xs text-slate-700 uppercase tracking-wider border-r border-slate-200">Row Labels</th>
                  <th className="px-6 py-3 text-right font-bold text-xs text-slate-700 uppercase tracking-wider border-r border-slate-200 w-44">Sum of Time (Min)</th>
                  <th className="px-6 py-3 text-left font-bold text-xs text-slate-700 uppercase tracking-wider border-r border-slate-200">Sum of Time (Hours)</th>
                  <th className="px-6 py-3 text-right font-bold text-xs text-slate-700 uppercase tracking-wider border-r border-slate-200 w-40">Productivity</th>
                  <th className="px-6 py-3 text-right font-bold text-xs text-slate-700 uppercase tracking-wider border-r border-slate-200 w-32">Target (Hrs)</th>
                  <th className="px-6 py-3 text-right font-bold text-xs text-slate-700 uppercase tracking-wider w-32">Leaves (Days)</th>
                </tr>
              </thead>
              <tbody>
                {prodItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted text-sm">
                      No developer logs recorded for this week.
                    </td>
                  </tr>
                ) : (
                  prodItems.map(item => {
                    const isExpanded = expandedDevId === item.developer_id
                    const isHigh = item.productivity_pct >= 100
                    const isLow = item.productivity_pct < 50

                    return (
                      <>
                        <tr
                          key={item.developer_id}
                          onClick={() => setExpandedDevId(isExpanded ? null : item.developer_id)}
                          className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                            isExpanded ? 'bg-forest-50/20' : ''
                          }`}
                        >
                          <td className="px-6 py-3.5 text-sm font-semibold text-charcoal border-r border-slate-100">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
                              <span>{item.full_name}</span>
                            </div>
                            <div className="pl-6 text-xs text-muted font-normal lowercase">
                              {item.dev_type}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-right font-mono text-slate-600 border-r border-slate-100">
                            {item.total_minutes.toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-slate-700 border-r border-slate-100">
                            {item.hours_str}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-right font-bold border-r border-slate-100">
                            <span className={`px-2.5 py-1 rounded-full text-xs ${
                              isHigh ? 'bg-emerald-50 text-emerald-700' : isLow ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
                            }`}>
                              {item.productivity_pct}%
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-right border-r border-slate-100">
                            <span className="text-xs text-slate-500">
                              {item.target_hours != null ? `${item.target_hours}h` : '40h'}
                              {item.leave_days > 0 && (
                                <span className="ml-1 text-amber-600 font-semibold">(−{item.leave_days}d)</span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-right font-bold text-slate-600">
                            {item.leave_days || 0}
                          </td>
                        </tr>

                        {/* Expanded Drill-Down Task Logs */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={6} className="px-8 py-4 border-b border-slate-200">
                              <div className="bg-white rounded-lg border border-border p-4 shadow-inner">
                                <h4 className="text-xs font-bold text-[#0D4F3C] uppercase tracking-wider mb-3">
                                  Weekly Log Sheet — {item.full_name}
                                </h4>
                                {item.tasks.length === 0 ? (
                                  <p className="text-xs text-muted">No individual logs recorded</p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                          <th className="py-2 text-left font-bold">Ticket ID</th>
                                          <th className="py-2 text-left font-bold">Subject</th>
                                          <th className="py-2 text-left font-bold">Track</th>
                                          <th className="py-2 text-left font-bold">Status</th>
                                          <th className="py-2 text-right font-bold">Hours Logged</th>
                                          <th className="py-2 text-right font-bold">Logged At</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.tasks.map(t => (
                                          <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                            <td className="py-2"><span className="ticket font-mono text-[10px]">{t.ticket_id || '—'}</span></td>
                                            <td className="py-2 font-medium text-slate-700">{t.task_title}</td>
                                            <td className="py-2">{trackBadge(t.track)}</td>
                                            <td className="py-2 capitalize">{t.status.replace('_', ' ')}</td>
                                            <td className="py-2 text-right font-semibold text-[#0D4F3C]">{t.hours_logged.toFixed(2)}h</td>
                                            <td className="py-2 text-right text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })
                )}

                {/* Grand Total Row */}
                {prodItems.length > 0 && (
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td className="px-6 py-4 text-sm text-slate-800">Grand Total</td>
                    <td className="px-6 py-4 text-sm text-right font-mono text-slate-800 border-r border-slate-200">
                      {totalMins.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 border-r border-slate-200">—</td>
                    <td className="px-6 py-4 text-sm text-right text-[#0D4F3C] border-r border-slate-200">
                      {avgProdPct}% Average
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-500 border-r border-slate-200">—</td>
                    <td className="px-6 py-4 text-sm text-right text-slate-800">
                      {totalLeaves}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── Charts & Metrics Row ── */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 transition-opacity ${fetching ? 'opacity-60' : ''}`}>
        
        {/* Developer Hours Bar Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-charcoal font-display">
                Developer Hours — {viewType === 'weekly' ? 'This Week' : 'This Month'}
              </h3>
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

        {/* Task Status Donut Chart */}
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
                    <Cell key={i} fill={STATUS_COLORS[entry.statusKey] || '#94A3B8'} />
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

    </Layout>
  )
}
