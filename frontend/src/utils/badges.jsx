/**
 * Shared badge helpers — previously copy-pasted in 5 page files.
 * Import from here instead of redefining locally.
 */

/**
 * Returns a styled badge element for a task status value.
 * @param {string} s  - 'completed' | 'in_progress' | 'pending' | 'on_hold'
 */
export function statusBadge(s) {
  const map = {
    completed:   <span className="badge-green">✓ Done</span>,
    in_progress: <span className="badge-amber">● WIP</span>,
    pending:     <span className="badge-gray">○ Pending</span>,
    on_hold:     <span className="badge-red">⏸ Hold</span>,
  }
  return map[s] ?? <span className="badge-gray">{s}</span>
}

/**
 * Returns a className string (not element) for status — used in Reports table.
 * @param {string} s
 */
export function statusClass(s) {
  return {
    completed:   'badge-green',
    in_progress: 'badge-amber',
    pending:     'badge-gray',
    on_hold:     'badge-red',
  }[s] || 'badge-gray'
}

/**
 * Returns a styled badge element for a track value.
 * @param {string} t  - e.g. 'RFH' | 'BPL' | 'SAP' | 'PROD' …
 */
export function trackBadge(t) {
  return t ? <span className={`track-${t}`}>{t}</span> : null
}

/**
 * Returns a styled badge element for timer_status.
 * @param {string} s  - 'active' | 'paused' | 'completed' | 'idle'
 */
export function timerBadge(s) {
  const map = {
    active:    <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><span className="status-active" />Live</span>,
    paused:    <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><span className="status-paused" />Paused</span>,
    completed: <span className="flex items-center gap-1 text-blue-600 text-xs font-semibold">✓ Done</span>,
  }
  return map[s] ?? <span className="text-muted text-xs">—</span>
}

/**
 * Returns a styled badge element for task priority.
 * @param {string} p  - 'high' | 'medium' | 'low'
 */
export function priorityBadge(p) {
  if (p === 'high')   return <span className="badge-red">High</span>
  if (p === 'medium') return <span className="badge-amber">Medium</span>
  return <span className="badge-gray">Low</span>
}

/**
 * Inline track badge map used inside TaskCard.
 */
export const TRACK_BADGE_MAP = {
  RFH: 'track-RFH', BPL: 'track-BPL', SAP: 'track-SAP',
  NON_SAP: 'track-NON_SAP', PROD: 'track-PROD', MEETING: 'track-MEETING',
  CODE_REVIEW: 'track-CODE_REVIEW', RESEARCH: 'track-RESEARCH',
}
