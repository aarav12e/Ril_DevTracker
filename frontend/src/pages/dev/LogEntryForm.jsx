import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { TRACKS, TYPE_OF_DEV, PRIORITIES, DEV_TYPES } from '../../constants'
import { Save, X, Info } from 'lucide-react'

export default function LogEntryForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    task_title: '', description: '', track: '', dev_type_task: '',
    type_of_development: '', cd_number: '', functional_team: '',
    priority: 'medium', start_date: '', due_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.start_date) delete payload.start_date
      if (!payload.due_date)   delete payload.due_date
      await api.post('/api/tasks', payload)
      navigate('/dev/logs')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save log')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => setForm({
    task_title: '', description: '', track: '', dev_type_task: '',
    type_of_development: '', cd_number: '', functional_team: '',
    priority: 'medium', start_date: '', due_date: '',
  })

  return (
    <Layout title="New Development Log" subtitle="Fill all required fields accurately">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={submit}>
          <div className="card border-l-4 border-forest-600">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-xl text-charcoal font-display">New Development Log Entry</h2>
                <p className="text-xs text-muted mt-1">Fill all required fields. This log will be reviewed by your team lead.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
                  <X size={15} /> Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                  {loading ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <Info size={15} /> {error}
              </div>
            )}

            {/* Auto-ticket info */}
            <div className="mb-5 bg-forest-50 border border-forest-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <Info size={15} className="text-forest-600" />
              <p className="text-xs text-forest-700">
                A unique ticket ID <span className="font-bold">DT-XXXXX</span> will be auto-generated when you save this log.
              </p>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Track */}
              <div>
                <label className="label">Track <span className="text-red-500">*</span></label>
                <select className="select" value={form.track} onChange={e => set('track', e.target.value)} required>
                  <option value="">Select Track</option>
                  {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Dev Type pill toggles */}
              <div>
                <label className="label">Dev Type</label>
                <div className="flex gap-2">
                  {DEV_TYPES.map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => set('dev_type_task', t)}
                      className={`flex-1 py-2.5 rounded-input text-sm font-semibold border transition-all duration-150 ${
                        form.dev_type_task === t
                          ? 'bg-forest-600 text-white border-forest-600'
                          : 'bg-white text-muted border-border hover:border-forest-400'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Type of Development */}
              <div>
                <label className="label">Type of Development <span className="text-red-500">*</span></label>
                <select className="select" value={form.type_of_development} onChange={e => set('type_of_development', e.target.value)} required>
                  <option value="">Select Type</option>
                  {TYPE_OF_DEV.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* CD Number */}
              <div>
                <label className="label flex items-center gap-1">
                  CD Number <Info size={12} className="text-muted cursor-help" title="Change Document number" />
                </label>
                <input className="input" placeholder="e.g. 8089020" value={form.cd_number} onChange={e => set('cd_number', e.target.value)} />
              </div>

              {/* Development Subject — full width */}
              <div className="md:col-span-2">
                <label className="label">Development Subject <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  placeholder="e.g. BPL Case Discount SOA and Invoice Print"
                  value={form.task_title}
                  onChange={e => set('task_title', e.target.value)}
                  required
                />
              </div>

              {/* Functional Team */}
              <div>
                <label className="label">Functional Team</label>
                <input className="input" placeholder="e.g. Biswajit" value={form.functional_team} onChange={e => set('functional_team', e.target.value)} />
              </div>

              {/* Developer — read only */}
              <div>
                <label className="label">Developer</label>
                <div className="input bg-surface flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-forest-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                  </span>
                  <span className="text-charcoal font-medium">{user?.full_name || user?.username}</span>
                  <span className="ml-auto badge-green text-[10px]">You</span>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              </div>

              {/* End Date */}
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>

              {/* Priority pill toggles */}
              <div>
                <label className="label">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p} type="button"
                      onClick={() => set('priority', p)}
                      className={`flex-1 py-2.5 rounded-input text-sm font-semibold border capitalize transition-all duration-150 ${
                        form.priority === p
                          ? p === 'high'   ? 'bg-red-500 text-white border-red-500'
                          : p === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-400 text-white border-slate-400'
                          : 'bg-white text-muted border-border hover:border-slate-400'
                      }`}
                    >{p}</button>
                  ))}
                </div>
              </div>

              {/* Remarks — full width */}
              <div className="md:col-span-2">
                <label className="label">Remarks</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Any additional notes or context for this log..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  maxLength={500}
                />
                <p className="text-right text-[10px] text-muted mt-1">{form.description.length}/500</p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
              <p className="text-xs text-muted"><span className="text-red-500">*</span> Required fields</p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={clear} className="btn-ghost text-muted">Clear Form</button>
                <button type="button" onClick={() => navigate(-1)} className="btn-outline">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                  {loading ? 'Saving...' : 'Submit Log'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}
