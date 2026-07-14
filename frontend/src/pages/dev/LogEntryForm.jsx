import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { TYPE_OF_DEV, PRIORITIES, DEV_TYPES, MODULES, CATEGORIES } from '../../constants'
import { Save, X, Info, Trash2, Calendar } from 'lucide-react'

const EMPTY_FORM = {
  task_title: '', description: '', track: 'RFH', dev_type_task: '',
  type_of_development: '', cd_number: '', functional_team: '',
  module: '', category: '', remarks: '',
  priority: 'medium', start_date: '', due_date: '',
  status: 'in_progress', minutes_logged: '0', user_id: ''
}

const REF_TYPES = ['CD Number', 'CCB ID', 'Support Ticket']

// Encode/decode the reference field stored as "TYPE:value" in cd_number
const encodeRef = (type, value) => (value ? `${type}:${value}` : '')
const decodeRef = (raw = '') => {
  const idx = raw.indexOf(':')
  if (idx === -1) return { type: 'CD Number', value: raw }
  return { type: raw.slice(0, idx), value: raw.slice(idx + 1) }
}

function calculateLeaveDays(fromStr, toStr) {
  if (!fromStr || !toStr) return 0
  const start = new Date(fromStr)
  const end = new Date(toStr)
  if (isNaN(start) || isNaN(end) || end < start) return 0
  
  let days = 0
  let curr = new Date(start)
  while (curr <= end) {
    const dayOfWeek = curr.getDay() // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++
    }
    curr.setDate(curr.getDate() + 1)
  }
  return days
}

export default function LogEntryForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = !!id

  const [entryType, setEntryType] = useState(() => {
    return location.state?.type || 'task'
  })
  const [form, setForm] = useState(EMPTY_FORM)
  const [refType, setRefType] = useState('CD Number')
  const [refValue, setRefValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [usersList, setUsersList] = useState([])

  // Leave Form state
  const [leaveForm, setLeaveForm] = useState({ from_date: '', to_date: '', reason: '' })

  useEffect(() => {
    if (location.state?.type) {
      setEntryType(location.state.type)
    } else {
      setEntryType('task')
    }
  }, [location])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      api.get('/api/users?is_active=true')
        .then(res => {
          setUsersList(res.data)
        })
        .catch(err => {
          console.error('Failed to load users list:', err)
        })
    }
  }, [user])

  useEffect(() => {
    if (isEdit) {
      const fetchTask = async () => {
        setLoading(true)
        try {
          const { data } = await api.get(`/api/tasks/${id}`)
          setForm({
            task_title: data.task_title || '',
            description: data.description || '',
            track: data.track || 'RFH',
            dev_type_task: data.dev_type_task || '',
            type_of_development: data.type_of_development || '',
            cd_number: data.cd_number || '',
            functional_team: data.functional_team || '',
            module: data.module || '',
            category: data.category || '',
            remarks: data.remarks || '',
            priority: data.priority || 'medium',
            start_date: data.start_date || '',
            due_date: data.due_date || '',
            status: data.status || 'in_progress',
            minutes_logged: data.hours_logged ? String(Math.round(parseFloat(data.hours_logged) * 60)) : '0',
            user_id: data.user_id || ''
          })
          const decoded = decodeRef(data.cd_number || '')
          setRefType(decoded.type)
          setRefValue(decoded.value)
        } catch (err) {
          setError(err.response?.data?.detail || 'Failed to fetch task details')
        } finally {
          setLoading(false)
        }
      }
      fetchTask()
    }
  }, [id, isEdit])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (entryType === 'leave') {
        if (calculateLeaveDays(leaveForm.from_date, leaveForm.to_date) === 0) {
          setError('Leave period cannot consist of weekends only')
          setLoading(false)
          return
        }
        await api.post('/api/leaves', leaveForm)
        toast.success('Leave requested successfully')
        navigate('/dev')
        return
      }

      const payload = { ...form }
      // encode the reference type + value into cd_number
      payload.cd_number = encodeRef(refType, refValue)
      if (!payload.start_date) delete payload.start_date
      if (!payload.due_date)   delete payload.due_date

      if (user?.role === 'admin' || user?.role === 'manager') {
        if (payload.user_id) {
          payload.user_id = parseInt(payload.user_id)
        } else {
          delete payload.user_id
        }
      } else {
        delete payload.user_id
      }

      const mins = parseFloat(payload.minutes_logged) || 0
      payload.hours_logged = parseFloat((mins / 60).toFixed(4))
      payload.total_seconds = Math.round(mins * 60)
      delete payload.minutes_logged

      if (isEdit) {
        await api.patch(`/api/tasks/${id}`, payload)
        toast.success('Log updated successfully')
      } else {
        await api.post('/api/tasks', payload)
        toast.success('Log created successfully')
      }
      navigate('/dev')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save log')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) return
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/api/tasks/${id}`)
      toast.success('Log deleted successfully')
      navigate('/dev')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete log')
    } finally {
      setDeleting(false)
    }
  }

  const titleText = isEdit
    ? 'Edit Development Log'
    : entryType === 'leave'
      ? 'Request Leave Application'
      : 'New Development Log'

  const subtitleText = isEdit
    ? 'Update your log entry details'
    : entryType === 'leave'
      ? 'Request time off (weekends will be automatically excluded)'
      : 'Fill all required fields accurately'

  return (
    <Layout title={titleText} subtitle={subtitleText}>
      <div className="w-full mx-auto">
        
        {/* ── Switcher between Task and Leave (only when adding a new entry) ── */}
        {!isEdit && (
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1.5 rounded-xl mb-5 w-fit">
            <button
              type="button"
              onClick={() => {
                setError('')
                setEntryType('task')
              }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                entryType === 'task' ? 'bg-[#0D4F3C] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Log Development Task
            </button>
            <button
              type="button"
              onClick={() => {
                setError('')
                setEntryType('leave')
              }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                entryType === 'leave' ? 'bg-[#0D4F3C] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Request Leave
            </button>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="card border-l-4 border-forest-600 p-4">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div>
                <h2 className="font-bold text-lg text-charcoal font-display leading-tight">
                  {isEdit
                    ? 'Edit Development Log Entry'
                    : entryType === 'leave'
                      ? 'Apply for Leave'
                      : 'New Development Log Entry'
                  }
                </h2>
                <p className="text-[11px] text-muted mt-0.5">
                  {isEdit
                    ? 'Modify fields below to update this task log.'
                    : entryType === 'leave'
                      ? 'Fill required fields to request a leave.'
                      : 'Fill required fields. This log will be reviewed by your team lead.'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      if (entryType === 'leave') {
                        setLeaveForm({ from_date: '', to_date: '', reason: '' })
                      } else {
                        setForm(EMPTY_FORM)
                      }
                    }}
                    className="btn-ghost text-xs px-2.5 py-1.5 text-muted hover:text-charcoal"
                  >
                    Clear Form
                  </button>
                )}
                <button type="button" onClick={() => navigate(-1)} className="btn-outline text-xs px-3 py-1.5">
                  <X size={13} /> Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1">
                  {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
                  {loading ? 'Submitting...' : entryType === 'leave' ? 'Apply Leave' : isEdit ? 'Save Changes' : 'Submit Log'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                <Info size={13} /> {error}
              </div>
            )}

            {entryType === 'leave' ? (
              /* ── Leave Application Form ── */
              <div className="space-y-4 max-w-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-[10px] mb-1">From Date</label>
                    <input
                      type="date"
                      required
                      className="input text-xs"
                      value={leaveForm.from_date}
                      onChange={e => setLeaveForm(p => ({ ...p, from_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label text-[10px] mb-1">To Date</label>
                    <input
                      type="date"
                      required
                      className="input text-xs"
                      value={leaveForm.to_date}
                      onChange={e => setLeaveForm(p => ({ ...p, to_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-[10px] mb-1">Reason for Leave</label>
                  <textarea
                    required
                    placeholder="e.g., Medical leave, family emergency, out of town..."
                    className="input text-xs h-24 resize-none py-2 px-3"
                    value={leaveForm.reason}
                    onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                    maxLength={200}
                  />
                </div>
                {calculateLeaveDays(leaveForm.from_date, leaveForm.to_date) > 0 && (
                  <div className="bg-forest-50 border border-forest-200 rounded-lg p-3 text-xs text-forest-800 font-semibold flex items-center gap-2">
                    <Calendar size={14} className="text-[#0D4F3C]" />
                    Total requested: {calculateLeaveDays(leaveForm.from_date, leaveForm.to_date)} weekday(s) leave (Saturdays and Sundays excluded)
                  </div>
                )}
              </div>
            ) : (
              /* ── Standard Task Log Form ── */
              <>
                {!isEdit && (
                  <div className="mb-3 bg-forest-50 border border-forest-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Info size={13} className="text-forest-600" />
                    <p className="text-[11px] text-forest-700">
                      A serial number (SR-XXXX) will be auto-assigned when you save this log.
                    </p>
                  </div>
                )}

                {/* ── Row 1: Track · Dev Type · Type of Dev · CD Number ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3.5 mb-3.5">
                  {/* Track — fixed */}
                  <div>
                    <label className="label text-[10px] mb-1">Track</label>
                    <div className="h-9 flex items-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-50 border border-forest-200 text-xs font-bold text-forest-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
                        RFH
                      </span>
                    </div>
                  </div>

                  {/* Dev Type — dropdown */}
                  <div>
                    <label className="label text-[10px] mb-1">Dev Type</label>
                    <select className="select py-2 text-xs h-9" value={form.dev_type_task} onChange={e => set('dev_type_task', e.target.value)}>
                      <option value="">Select Dev Type</option>
                      {DEV_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Type of Development */}
                  <div>
                    <label className="label text-[10px] mb-1">Type of Development</label>
                    <select className="select py-2 text-xs h-9" value={form.type_of_development} onChange={e => set('type_of_development', e.target.value)}>
                      <option value="">Select Type</option>
                      {TYPE_OF_DEV.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Reference Number (CD / DDB / Support Ticket) */}
                  <div>
                    <label className="label text-[10px] mb-1">Reference Number</label>
                    <div className="flex h-9 gap-0">
                      <select
                        className="select py-2 text-xs rounded-r-none border-r-0 w-[105px] flex-shrink-0 bg-forest-50 text-forest-700 font-semibold"
                        value={refType}
                        onChange={e => setRefType(e.target.value)}
                      >
                        {REF_TYPES.map(r => <option key={r}>{r}</option>)}
                      </select>
                      <input
                        className="input py-2 text-xs h-9 rounded-l-none flex-1 min-w-0"
                        placeholder={refType === 'CD Number' ? 'e.g. 8089020' : refType === 'CCB ID' ? 'CCB ID number' : 'Ticket number'}
                        value={refValue}
                        onChange={e => setRefValue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Row 2: Development Subject · Module · Category · Functional Team ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3.5 mb-3.5">
                  {/* Development Subject — spans 2 */}
                  <div className="col-span-2">
                    <label className="label text-[10px] mb-1">Development Subject</label>
                    <input
                      className="input py-2 text-xs h-9"
                      placeholder="e.g. BPL Case Discount SOA and Invoice Print"
                      value={form.task_title}
                      onChange={e => set('task_title', e.target.value)}
                    />
                  </div>

                  {/* Module */}
                  <div>
                    <label className="label text-[10px] mb-1">Module</label>
                    <select className="select py-2 text-xs h-9" value={form.module} onChange={e => set('module', e.target.value)}>
                      <option value="">Select Module</option>
                      {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="label text-[10px] mb-1">Category</label>
                    <select className="select py-2 text-xs h-9" value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">Select Category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* ── Row 3: Functional Team · Developer · Start Date · End Date ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3.5 mb-3.5">
                  {/* Functional Team */}
                  <div>
                    <label className="label text-[10px] mb-1">Functional Team</label>
                    <input className="input py-2 text-xs h-9" placeholder="e.g. Biswajit" value={form.functional_team} onChange={e => set('functional_team', e.target.value)} />
                  </div>

                  {/* Developer / Assignee */}
                  <div>
                    <label className="label text-[10px] mb-1">Assignee (Developer/Intern)</label>
                    {user?.role === 'admin' || user?.role === 'manager' ? (
                      <select
                        className="select py-2 text-xs h-9"
                        value={form.user_id}
                        onChange={e => set('user_id', e.target.value)}
                      >
                        <option value="">Self (Assign to Me)</option>
                        {usersList.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.full_name || u.username} ({u.role})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="input bg-surface py-1 text-xs h-9 flex items-center gap-1.5 border border-border">
                        <span className="w-5 h-5 rounded-full bg-forest-600 flex items-center justify-center text-white text-[9px] font-bold">
                          {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                        </span>
                        <span className="text-charcoal font-medium truncate max-w-[110px]">{user?.full_name || user?.username}</span>
                        <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded">You</span>
                      </div>
                    )}
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="label text-[10px] mb-1">Start Date</label>
                    <input type="date" className="input py-2 text-xs h-9" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="label text-[10px] mb-1">End Date</label>
                    <input type="date" className="input py-2 text-xs h-9" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                  </div>
                </div>

                {/* ── Row 4: Priority · Status · Time Logged ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3.5 mb-3.5">
                  {/* Priority */}
                  <div>
                    <label className="label text-[10px] mb-1">Priority</label>
                    <div className="flex gap-1">
                      {PRIORITIES.map(p => (
                        <button
                          key={p} type="button"
                          onClick={() => set('priority', p)}
                          className={`flex-1 py-1.5 rounded text-[11px] font-semibold border capitalize transition-all duration-150 h-9 ${
                            form.priority === p
                              ? p === 'high'   ? 'bg-red-500 text-white border-red-500'
                              : p === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-slate-500 text-white border-slate-500'
                              : 'bg-white text-muted border-border hover:border-slate-400'
                          }`}
                        >{p}</button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="label text-[10px] mb-1">Status</label>
                    <select className="select py-2 text-xs h-9" value={form.status} onChange={e => set('status', e.target.value)}>
                      <option value="in_progress">WIP</option>
                      <option value="fut">FUT</option>
                      <option value="completed">PROD</option>
                      <option value="hold_functional">Hold by Functional</option>
                      <option value="hold_developer">Hold by Developer</option>
                    </select>
                  </div>

                  {/* Time Logged */}
                  <div>
                    <label className="label text-[10px] mb-1 flex items-center justify-between">
                      <span>Time Logged (Mins)</span>
                      {form.minutes_logged > 0 && (
                        <span className="text-[9px] text-muted normal-case font-normal">
                          = {(parseFloat(form.minutes_logged || 0) / 60).toFixed(1)}h
                        </span>
                      )}
                    </label>
                    <input
                      type="number" step="1" min="0"
                      className="input py-2 text-xs h-9"
                      placeholder="e.g. 90"
                      value={form.minutes_logged}
                      onChange={e => set('minutes_logged', e.target.value)}
                    />
                  </div>

                  {/* Spacer */}
                  <div className="hidden md:block"></div>
                </div>

                {/* ── Row 5: Development Description · Remarks ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Development Description */}
                  <div>
                    <label className="label text-[10px] mb-1 flex items-center justify-between">
                      <span>Development Description</span>
                      <span className="text-[9px] text-muted normal-case font-normal">{(form.description || '').length}/500</span>
                    </label>
                    <textarea
                      className="input py-1.5 px-3 text-xs h-16 resize-none"
                      placeholder="Detailed explanation of the development..."
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="label text-[10px] mb-1 flex items-center justify-between">
                      <span>Remarks</span>
                      <span className="text-[9px] text-muted normal-case font-normal">{(form.remarks || '').length}/500</span>
                    </label>
                    <textarea
                      className="input py-1.5 px-3 text-xs h-16 resize-none"
                      placeholder="Additional notes or context..."
                      value={form.remarks}
                      onChange={e => set('remarks', e.target.value)}
                      maxLength={500}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-5 pt-3 border-t border-border">
              <p className="text-[10px] text-muted">
                {entryType === 'leave'
                  ? 'Note: Applied leaves are automatically recorded and reviewed.'
                  : 'All fields are optional. Leave empty to default.'
                }
              </p>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-60"
                >
                  {deleting ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <Trash2 size={13} />}
                  {deleting ? 'Deleting...' : 'Delete Log'}
                </button>
              )}
            </div>

          </div>
        </form>
      </div>
    </Layout>
  )
}
