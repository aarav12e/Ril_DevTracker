import { Play, Pause, CheckCircle, Zap, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LiveTimer from './LiveTimer'
import { TRACK_BADGE_MAP } from '../../utils/badges'

/**
 * TaskCard — displays a single task with timer status and control actions.
 * Extracted from DevDashboard.jsx.
 */
export default function TaskCard({ task, onStart, onPause, onResume, onComplete, onSwitch }) {
  const navigate = useNavigate()
  const isActive    = task.timer_status === 'active'
  const isPaused    = task.timer_status === 'paused'
  const isCompleted = task.timer_status === 'completed'

  const borderColor = isActive
    ? 'border-l-emerald-500'
    : isPaused
    ? 'border-l-amber-400'
    : isCompleted
    ? 'border-l-blue-400'
    : 'border-l-slate-300'

  const bgColor = isActive
    ? 'bg-emerald-50/40'
    : isPaused
    ? 'bg-amber-50/40'
    : 'bg-white'

  const trackEl = task.track
    ? <span className={TRACK_BADGE_MAP[task.track] || 'badge-gray'}>{task.track}</span>
    : null

  const priorityEl = task.priority === 'high'
    ? <span className="badge-red">High Priority</span>
    : task.priority === 'medium'
    ? <span className="badge-amber">Medium</span>
    : <span className="badge-gray">Low</span>

  return (
    <div className={`rounded-card border-l-4 ${borderColor} ${bgColor} border border-border p-4 shadow-card transition-all duration-200`}>
      {/* Production warning banner */}
      {task.track === 'PROD' && (
        <div className="mb-3 -mx-4 -mt-4 px-4 py-2 bg-amber-50 border-b border-amber-200 rounded-t-card flex items-center gap-2">
          <Zap size={13} className="text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">Production Issue — High Priority</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Left — meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {isActive    && <span className="flex items-center gap-1 badge-green"><span className="status-active" />Active</span>}
            {isPaused    && <span className="flex items-center gap-1 badge-amber"><span className="status-paused" />Paused</span>}
            {isCompleted && <span className="flex items-center gap-1 badge-blue">✓ Completed</span>}
            {!isActive && !isPaused && !isCompleted && <span className="badge-gray">Idle</span>}
            <span className="ticket">{task.ticket_id || '—'}</span>
            {trackEl}
            {priorityEl}
          </div>
          <p className="font-semibold text-charcoal text-sm leading-snug">{task.task_title}</p>
          {task.functional_team && (
            <p className="text-xs text-muted mt-0.5">{task.type_of_development} · {task.functional_team}</p>
          )}
        </div>

        {/* Right — timer + controls */}
        <div className="flex-shrink-0 text-right">
          {(isActive || isPaused) && (
            <LiveTimer baseSeconds={task.total_seconds || 0} running={isActive} />
          )}
          {isCompleted && (
            <span className="font-mono font-bold text-lg text-muted">{task.hours_logged || 0}h</span>
          )}
          {!isActive && !isPaused && !isCompleted && (
            <span className="font-mono text-muted text-sm">00:00:00</span>
          )}

          <div className="flex items-center gap-2 mt-2 justify-end">
            <button onClick={() => navigate(`/dev/edit/${task.id}`)}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors" title="Edit Task">
              <Edit2 size={12} />
            </button>
            {!isCompleted && !isActive && !isPaused && (
              <button onClick={() => onStart(task.id)} className="btn-primary text-xs py-1.5 px-3">
                <Play size={12} /> Start
              </button>
            )}
            {isActive && (
              <>
                <button onClick={() => onPause(task.id)} className="btn-amber text-xs py-1.5 px-3">
                  <Pause size={12} /> Pause
                </button>
                <button onClick={() => onComplete(task.id)} className="btn-outline text-xs py-1.5 px-3">
                  <CheckCircle size={12} /> Done
                </button>
              </>
            )}
            {isPaused && (
              <>
                <button onClick={() => onResume(task.id)} className="btn-primary text-xs py-1.5 px-3">
                  <Play size={12} /> Resume
                </button>
                <button onClick={() => onComplete(task.id)} className="btn-outline text-xs py-1.5 px-3">
                  <CheckCircle size={12} /> Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
