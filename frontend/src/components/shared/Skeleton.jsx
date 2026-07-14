/**
 * Skeleton — shimmer loading placeholders for all major page layouts.
 * Usage:
 *   import { SkeletonDashboard, SkeletonTable } from '../shared/Skeleton'
 *   {loading ? <SkeletonDashboard /> : <ActualContent />}
 */

/** Base shimmer block — use for any arbitrary rectangle */
export function Skeleton({ className = '' }) {
  return (
    <div className={`skeleton ${className}`} />
  )
}

/** One or more lines of placeholder text */
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: i === lines - 1 && lines > 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  )
}

/** KPI stat card skeleton */
export function SkeletonKpiCard() {
  return (
    <div className="card flex items-center gap-4">
      <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-6 w-12 rounded" />
        <div className="skeleton h-2.5 w-16 rounded" />
      </div>
    </div>
  )
}

/** A single table row skeleton */
export function SkeletonTableRow({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="table-cell">
          <div className="skeleton h-3 rounded" style={{ width: `${55 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

/** Full admin dashboard skeleton (KPI row + table) */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonKpiCard key={i} />)}
      </div>

      {/* Productivity table card */}
      <div className="card p-0 overflow-hidden">
        {/* Table header bar */}
        <div className="bg-[#D9E1F2] border-b border-slate-300 px-6 py-4">
          <div className="skeleton h-4 w-48 rounded" />
          <div className="skeleton h-3 w-32 rounded mt-2" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {['Developer', 'Target', 'Logged', 'Productivity', 'Leave', 'Tasks'].map(h => (
                  <th key={h} className="table-cell">
                    <div className="skeleton h-3 w-16 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {/* Developer cell */}
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="skeleton w-7 h-7 rounded-full flex-shrink-0" />
                      <div className="space-y-1.5">
                        <div className="skeleton h-3 w-24 rounded" />
                        <div className="skeleton h-2 w-14 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="table-cell"><div className="skeleton h-3 w-12 rounded" /></td>
                  <td className="table-cell"><div className="skeleton h-3 w-16 rounded" /></td>
                  <td className="table-cell">
                    <div className="space-y-1.5">
                      <div className="skeleton h-2 w-full rounded-full" />
                      <div className="skeleton h-3 w-8 rounded" />
                    </div>
                  </td>
                  <td className="table-cell"><div className="skeleton h-3 w-10 rounded" /></td>
                  <td className="table-cell"><div className="skeleton h-6 w-16 rounded-lg" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/** Generic table skeleton used in Reports / MyLogs */
export function SkeletonTable({ rows = 8, cols = 8 }) {
  return (
    <div className="card p-0 overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b border-border">
        <div className="skeleton h-4 w-36 rounded" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="table-cell">
                  <div className="skeleton h-3 w-16 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Dev dashboard skeleton — greeting banner + KPIs + today breakdown */
export function SkeletonDevDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting banner */}
      <div className="rounded-card p-6" style={{ background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b52 100%)' }}>
        <div className="skeleton h-4 w-40 rounded mb-3 opacity-40" />
        <div className="skeleton h-6 w-64 rounded opacity-40" />
        <div className="skeleton h-3 w-48 rounded mt-2 opacity-40" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonKpiCard key={i} />)}
      </div>

      {/* Today's tasks card */}
      <div className="card space-y-3">
        <div className="skeleton h-4 w-36 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <div className="skeleton w-2 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-2.5 w-1/3 rounded" />
            </div>
            <div className="skeleton h-5 w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
