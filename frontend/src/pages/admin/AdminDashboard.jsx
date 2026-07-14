import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import { SkeletonDashboard } from '../../components/shared/Skeleton'
import { trackBadge } from '../../utils/badges'
import { STATUS_COLORS } from '../../constants'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, Clock, CheckCircle, TrendingUp,
  RefreshCw, Download, ChevronRight, ChevronDown, Award,
  ChevronLeft, Calendar, CalendarRange, BarChart2, Zap,
  Star, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'

const VIEW_MODES = [
  { key: 'weekly',  label: 'Weekly',       icon: BarChart2 },
  { key: 'monthly', label: 'Monthly',      icon: Calendar },
  { key: 'custom',  label: 'Custom Range', icon: CalendarRange },
]

/* ── Mini stat badge next to productivity % ── */
function ProdBadge({ pct }) {
  if (pct >= 100) return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><Star size={9} fill="currentColor" /> Top</span>
  if (pct >= 75)  return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full"><ArrowUp size={9} /> Good</span>
  if (pct >= 50)  return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full"><Minus size={9} /> Fair</span>
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full"><ArrowDown size={9} /> Low</span>
}

/* ── Beautiful gradient KPI card ── */
function StatCard({ icon: Icon, label, value, sub, gradient, iconBg }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg" style={{ background: gradient }}>
      {/* decorative circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full opacity-10 bg-white" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold font-display leading-none mb-1">{value}</p>
          {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

/* ── Progress bar for productivity column ── */
function ProdBar({ pct }) {
  const clamped = Math.min(pct, 100)
  const color = pct >= 100 ? '#10b981' : pct >= 75 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

export default function AdminDashboard() {
  const { toast } = useToast()

  const [viewType, setViewType] = useState('weekly')
  const [offset, setOffset] = useState(0)
  const today = new Date().toISOString().slice(0, 10)
  const [customFrom, setCustomFrom] = useState(today)
  const [customTo,   setCustomTo]   = useState(today)

  const [productivityData, setProductivityData] = useState(null)
  const [data, setData] = useState(null)
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
        setProductivityData(p.data); setData(a.data)
      } else if (viewType === 'monthly') {
        const [p, a] = await Promise.all([
          api.get('/api/analytics/monthly-productivity', { params: { offset } }),
          api.get('/api/analytics/dashboard/admin', { params: { view_type: 'monthly', offset } }),
        ])
        setProductivityData(p.data); setData(a.data)
      } else {
        if (!customFrom || !customTo) return
        const p = await api.get('/api/analytics/custom-productivity', {
          params: { from_date: customFrom, to_date: customTo }
        })
        setProductivityData(p.data); setData(null)
      }
    } catch {
      toast.error('Failed to fetch dashboard data')
    } finally {
      setInitLoading(false); setFetching(false)
    }
  }

  useEffect(() => {
    fetchDashboard(initLoading)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType, offset])

  const handleCustomApply = () => {
    if (customFrom > customTo) { toast.error('Start date cannot be after end date'); return }
    fetchDashboard(false)
  }

  const handleExportProductivity = () => {
    api.get('/api/analytics/weekly-productivity/export', { params: { offset }, responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url; a.download = `weekly_productivity_offset_${offset}.xlsx`; a.click()
      })
      .catch(() => toast.error('Excel export failed'))
  }

  if (initLoading) {
    return (
      <Layout title="Dashboard Overview" subtitle="Loading dashboard metrics...">
        <SkeletonDashboard />
      </Layout>
    )
  }

  // ── derived ──────────────────────────────────────────────────
  const devChartData = (data?.developer_breakdown || []).map(d => ({
    name: (d.full_name || d.username).split(' ')[0],
    hours: parseFloat(d.total_hours.toFixed(1)),
  }))

  const statusData = Object.entries(data?.status_breakdown || {}).map(([name, value]) => ({
    name: name === 'completed' ? 'Done' : name === 'in_progress' ? 'In Progress' : name.replace('_', ' '),
    value,
    statusKey: name,
  }))

  const prodItems      = productivityData?.data || []
  const totalMins      = prodItems.reduce((s, i) => s + i.total_minutes, 0)
  const totalTargetMins= prodItems.reduce((s, i) => s + (i.target_minutes || 2400), 0)
  const avgProdPct     = totalTargetMins > 0 ? Math.round((totalMins / totalTargetMins) * 100) : 0
  const totalLeaves    = prodItems.reduce((s, i) => s + (i.leave_days || 0), 0)
  const topDev         = [...prodItems].sort((a, b) => b.productivity_pct - a.productivity_pct)[0]

  const periodLabel = productivityData?.period_label || productivityData?.week_label || data?.week_label || ''
  const dateRange   = productivityData?.date_range || data?.date_range || ''
  const tableTitle  =
    viewType === 'weekly'  ? 'Developers Weekly (40 hours) productivity' :
    viewType === 'monthly' ? `Developers Monthly productivity — ${periodLabel}` :
                             `Developers productivity — ${periodLabel}`

  return (
    <Layout title="Dashboard Overview" subtitle={`Overview · ${periodLabel}`}>
      {/* ════════════════════════════════════════════
          CONTROL BAR
      ════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">

        {/* Pill tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {VIEW_MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setViewType(key); setOffset(0); setExpandedDevId(null) }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewType === key
                  ? 'bg-[#0D4F3C] text-white shadow-sm'
                  : 'text-slate-500 hover:text-charcoal hover:bg-white/70'
              }`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Nav arrows */}
        {(viewType === 'weekly' || viewType === 'monthly') && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setOffset(o => o + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              <ChevronLeft size={13} /> Prev {viewType === 'weekly' ? 'Week' : 'Month'}
            </button>
            {offset > 0 && (
              <button onClick={() => setOffset(0)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0D4F3C] hover:bg-forest-50 transition-all border border-[#0D4F3C]/20">
                Current
              </button>
            )}
            <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              Next {viewType === 'weekly' ? 'Week' : 'Month'} <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Custom date pickers */}
        {viewType === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            {[['From', customFrom, setCustomFrom], ['To', customTo, setCustomTo]].map(([lbl, val, setter]) => (
              <div key={lbl} className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-500">{lbl}</label>
                <input type="date" value={val} max={today}
                  onChange={e => setter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0D4F3C]/30" />
              </div>
            ))}
            <button onClick={handleCustomApply} disabled={fetching}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0D4F3C] text-white rounded-lg text-xs font-bold hover:bg-[#0a3d2e] transition-all disabled:opacity-50">
              {fetching ? <RefreshCw size={12} className="animate-spin" /> : null} Apply
            </button>
          </div>
        )}

        {/* Date range label + team average + update indicator */}
        <div className="ml-auto flex items-center gap-3 text-xs">
          {dateRange && <span className="hidden md:inline font-medium text-slate-500">{dateRange}</span>}
          <div className="flex items-center gap-1.5 bg-forest-50 text-[#0D4F3C] font-bold px-2.5 py-1 rounded-lg border border-forest-100">
            <span>Team Avg: {avgProdPct}%</span>
          </div>
          {fetching && (
            <span className="flex items-center gap-1.5 animate-pulse text-[#0D4F3C] font-semibold">
              <RefreshCw size={12} className="animate-spin" /> Updating…
            </span>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          KPI CARDS — gradient style
      ════════════════════════════════════════════ */}
      {data && (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-opacity ${fetching ? 'opacity-60' : ''}`}>
          <StatCard icon={Users}       label="Total Users"   value={data?.kpis?.total_users || 0}
            sub="Active accounts"
            gradient="linear-gradient(135deg, #0D4F3C, #1a6b52)"
            iconBg="bg-white/20" />
          <StatCard icon={Clock}       label={`Hours This ${viewType === 'monthly' ? 'Month' : 'Week'}`}
            value={`${data?.kpis?.total_hours_this_week || 0}h`}
            sub="All developers"
            gradient="linear-gradient(135deg, #1d4ed8, #2563eb)"
            iconBg="bg-white/20" />
          <StatCard icon={Zap}         label="In Progress"   value={data?.kpis?.in_progress_this_week || 0}
            sub="Active tasks"
            gradient="linear-gradient(135deg, #b45309, #d97706)"
            iconBg="bg-white/20" />
          <StatCard icon={CheckCircle} label="Completed"     value={data?.kpis?.completed_this_week || 0}
            sub={`This ${viewType === 'monthly' ? 'month' : 'week'}`}
            gradient="linear-gradient(135deg, #0369a1, #0284c7)"
            iconBg="bg-white/20" />
        </div>
      )}

      {/* ════════════════════════════════════════════
          PRODUCTIVITY TABLE
      ════════════════════════════════════════════ */}
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-md mb-6 overflow-hidden transition-opacity ${fetching ? 'opacity-60' : ''}`}>

        {/* Table header bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-b border-slate-100"
          style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #eef2ff 100%)' }}>
          <div>
            <h2 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
              <BarChart2 size={15} className="text-[#0D4F3C]" />
              {periodLabel}
              {dateRange && viewType !== 'weekly' && (
                <span className="ml-1 text-xs font-normal text-slate-400">({dateRange})</span>
              )}
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">{tableTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              <Award size={9} className="text-[#0D4F3C]" /> Target = 40h − leave days
              {productivityData?.period_weekdays != null && viewType !== 'weekly' && (
                <> · {productivityData.period_weekdays} working days</>
              )}
            </span>
            {viewType === 'weekly' && (
              <button onClick={handleExportProductivity}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#0D4F3C] text-[#0D4F3C] text-xs font-semibold hover:bg-forest-50 transition-all">
                <Download size={12} /> Export
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developer</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hours</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-52">Productivity</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leaves</th>
              </tr>
            </thead>
            <tbody>
              {prodItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart2 size={32} className="text-slate-200" />
                      No developer logs recorded for this period.
                    </div>
                  </td>
                </tr>
              ) : (
                prodItems.map((item, idx) => {
                  const isExpanded = expandedDevId === item.developer_id
                  const initials = (item.full_name || item.username).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                  const isTop = idx === 0 && item.productivity_pct >= 75

                  return (
                    <>
                      <tr
                        key={item.developer_id}
                        onClick={() => setExpandedDevId(isExpanded ? null : item.developer_id)}
                        className={`border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50/80 ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                      >
                        {/* Developer */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {isExpanded
                              ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                              : <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                            }
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: isTop ? 'linear-gradient(135deg,#C9A84C,#f59e0b)' : 'linear-gradient(135deg,#0D4F3C,#1a6b52)' }}>
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-slate-700">{item.full_name}</span>
                                {isTop && <Star size={10} fill="#C9A84C" className="text-gold-400" />}
                              </div>
                              <span className="text-[10px] text-slate-400 capitalize">{item.dev_type}</span>
                            </div>
                          </div>
                        </td>

                        {/* Minutes */}
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-mono font-semibold text-slate-600">{item.total_minutes.toLocaleString()}</span>
                        </td>

                        {/* Hours */}
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600">{item.hours_str}</span>
                          {item.weekend_minutes > 0 && (
                            <div className="text-[10px] text-purple-500 font-semibold mt-0.5">
                              +{Math.round(item.weekend_minutes / 60 * 10) / 10}h weekend extra
                            </div>
                          )}
                        </td>

                        {/* Productivity bar */}
                        <td className="px-6 py-4 w-52">
                          <div className="space-y-1">
                            <ProdBar pct={item.productivity_pct} />
                            <ProdBadge pct={item.productivity_pct} />
                          </div>
                        </td>

                        {/* Target */}
                        <td className="px-4 py-4 text-right">
                          <span className="text-xs font-semibold text-slate-500">
                            {item.target_hours != null ? `${item.target_hours}h` : '—'}
                          </span>
                          {item.leave_days > 0 && (
                            <div className="text-[10px] text-amber-500 font-semibold">−{item.leave_days}d leave</div>
                          )}
                        </td>

                        {/* Leaves */}
                        <td className="px-4 py-4 text-right">
                          {item.leave_days > 0
                            ? <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2 py-0.5 rounded-full">{item.leave_days}d</span>
                            : <span className="text-slate-300 text-xs">—</span>
                          }
                        </td>
                      </tr>

                      {/* Expanded drill-down */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={6} className="px-8 py-4 border-b border-slate-100">
                            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                              <h4 className="text-xs font-bold text-[#0D4F3C] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <BarChart2 size={11} />
                                Task Log — {item.full_name}
                                <span className="ml-1 font-normal text-slate-400 normal-case">{dateRange}</span>
                              </h4>
                              {item.tasks.length === 0 ? (
                                <p className="text-xs text-slate-400 py-2">No individual logs recorded</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-100 text-slate-400">
                                        <th className="py-2 text-left font-semibold">Ticket</th>
                                        <th className="py-2 text-left font-semibold">Subject</th>
                                        <th className="py-2 text-left font-semibold">Track</th>
                                        <th className="py-2 text-left font-semibold">Status</th>
                                        <th className="py-2 text-right font-semibold">Hours</th>
                                        <th className="py-2 text-right font-semibold">Logged</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.tasks.map(t => (
                                        <tr key={t.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${t.is_weekend_work ? 'bg-purple-50/30' : ''}`}>
                                          <td className="py-2"><span className="ticket font-mono text-[10px]">{t.ticket_id || '—'}</span></td>
                                          <td className="py-2 font-medium text-slate-700 max-w-xs truncate">{t.task_title}
                                            {t.is_weekend_work && <span className="ml-1 text-[9px] bg-purple-100 text-purple-600 font-bold px-1 py-0.5 rounded uppercase">Weekend</span>}
                                          </td>
                                          <td className="py-2">{trackBadge(t.track)}</td>
                                          <td className="py-2 capitalize text-slate-500">{t.status.replace('_', ' ')}</td>
                                          <td className="py-2 text-right font-semibold text-[#0D4F3C]">{t.hours_logged.toFixed(2)}h</td>
                                          <td className="py-2 text-right text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
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
                <tr style={{ background: 'linear-gradient(90deg, #f8fafc, #eef2ff)' }} className="border-t-2 border-slate-200">
                  <td className="px-6 py-4 text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Award size={14} className="text-[#0D4F3C]" /> Grand Total
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-bold font-mono text-slate-700">{totalMins.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-slate-400">—</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#0D4F3C]" style={{ width: `${Math.min(avgProdPct, 100)}%` }} />
                      </div>
                      <span className="font-bold text-[#0D4F3C] text-sm">{avgProdPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-slate-400 text-sm">—</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-700 text-sm">{totalLeaves}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          CHARTS ROW
      ════════════════════════════════════════════ */}
      {data && (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 transition-opacity ${fetching ? 'opacity-60' : ''}`}>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-700 font-display text-sm">
                  Developer Hours — {viewType === 'monthly' ? 'This Month' : 'This Week'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Hours logged per developer</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-forest-50 flex items-center justify-center">
                <TrendingUp size={15} className="text-forest-600" />
              </div>
            </div>
            {devChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={devChartData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    formatter={v => [`${v}h`, 'Hours']}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                    {devChartData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#C9A84C' : '#0D4F3C'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm flex-col gap-2">
                <BarChart2 size={32} />No data yet
              </div>
            )}
          </div>

          {/* Donut chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-5">
              <h3 className="font-bold text-slate-700 font-display text-sm">Task Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Breakdown by status</p>
            </div>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.statusKey] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm flex-col gap-2">
                <CheckCircle size={32} />No tasks yet
              </div>
            )}
          </div>

        </div>
      )}

    </Layout>
  )
}
