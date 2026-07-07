import { useState } from 'react'
import { Play } from 'lucide-react'
import api from '../../api/axios'
import { TYPE_OF_DEV, DEV_TYPES } from '../../constants'
import { useToast } from '../../context/ToastContext'

/**
 * QuickAddForm — inline task creation form shown on the dev dashboard.
 * Extracted from DevDashboard.jsx.
 *
 * @param {() => void} onSuccess - called after a task is successfully created
 */
export default function QuickAddForm({ onSuccess }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    task_title: '',
    track: 'RFH',
    dev_type_task: '',
    type_of_development: '',
    priority: 'medium',
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.task_title.trim()) return
    setLoading(true)
    try {
      await api.post('/api/tasks', form)
      setForm({ task_title: '', track: 'RFH', dev_type_task: '', type_of_development: '', priority: 'medium' })
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Development Subject</label>
        <input
          className="input"
          placeholder="e.g. BPL Case Discount SOA fix"
          value={form.task_title}
          onChange={e => set('task_title', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Track</label>
          <div className="h-[42px] flex items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-50 border border-forest-200 text-xs font-bold text-forest-700">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
              RFH
            </span>
          </div>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Dev Type</label>
        <select className="select" value={form.dev_type_task} onChange={e => set('dev_type_task', e.target.value)}>
          <option value="">Select Dev Type</option>
          {DEV_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Type of Development</label>
        <select
          className="select"
          value={form.type_of_development}
          onChange={e => set('type_of_development', e.target.value)}
        >
          <option value="">Select type</option>
          {TYPE_OF_DEV.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 disabled:opacity-60">
        {loading
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Play size={14} />
        }
        {loading ? 'Creating...' : 'Start Task & Begin Timer'}
      </button>
      <p className="text-center text-[10px] text-muted">5-character ticket generated automatically</p>
    </form>
  )
}
