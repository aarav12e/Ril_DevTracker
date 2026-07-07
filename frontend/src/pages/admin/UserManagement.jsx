import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { ROLES, DEV_STACK_TYPES } from '../../constants'
import { Plus, Search, Edit2, UserX, UserCheck, X, Users, ChevronDown } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const c = { admin: 'badge-purple', manager: 'badge-blue', developer: 'badge-green', intern: 'badge-amber' }[role] || 'badge-gray'
  return <span className={c}>{role}</span>
}

function Drawer({ open, onClose, editUser, onSaved }) {
  const [form, setForm] = useState({
    username: '', email: '', password: '', full_name: '', role: 'developer', dev_type: 'react', domain: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Custom multi-select & custom technology state
  const [availableDevTypes, setAvailableDevTypes] = useState(['react', 'angular', 'python', 'node', 'sap', 'golang'])
  const [newTypeInput, setNewTypeInput] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const baseList = ['react', 'angular', 'python', 'node', 'sap', 'golang']
    if (editUser) {
      const vals = editUser.dev_type ? editUser.dev_type.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : []
      const merged = Array.from(new Set([...baseList, ...vals]))
      setAvailableDevTypes(merged)
      setForm({ ...editUser, password: '' })
    } else {
      setAvailableDevTypes(baseList)
      setForm({ username: '', email: '', password: '', full_name: '', role: 'developer', dev_type: 'react', domain: '' })
    }
    setError('')
    setDropdownOpen(false)
  }, [editUser, open])

  const selectedTypes = form.dev_type ? form.dev_type.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : []

  const toggleDevType = (tech) => {
    let updated
    if (selectedTypes.includes(tech)) {
      updated = selectedTypes.filter(t => t !== tech)
    } else {
      updated = [...selectedTypes, tech]
    }
    set('dev_type', updated.join(', '))
  }

  const handleAddCustomTech = (e) => {
    if (e) e.preventDefault()
    const cleaned = newTypeInput.trim().toLowerCase()
    if (!cleaned) return
    
    if (!availableDevTypes.includes(cleaned)) {
      setAvailableDevTypes(prev => [...prev, cleaned])
    }
    
    if (!selectedTypes.includes(cleaned)) {
      const updated = [...selectedTypes, cleaned]
      set('dev_type', updated.join(', '))
    }
    setNewTypeInput('')
  }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = { ...form }
      if (!editUser && !payload.password) {
        payload.password = 'Reliance@123'
      }
      if (editUser) {
        await api.patch(`/api/users/${editUser.id}`, {
          full_name: payload.full_name, role: payload.role, dev_type: payload.dev_type, is_active: payload.is_active,
        })
      } else {
        await api.post('/api/users', payload)
      }
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save user')
    } finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="font-bold text-lg text-charcoal font-display">
            {editUser ? 'Edit Developer' : 'Add New Developer'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="Sucharith Kumar" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
          </div>

          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input type="email" className="input" placeholder="name@reliancehospital.com" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          {!editUser && (
            <div>
              <label className="label">Password (Optional)</label>
              <input type="password" className="input" placeholder="Default: Reliance@123" value={form.password} onChange={e => set('password', e.target.value)} />
              <p className="text-[10px] text-muted mt-1">🔒 If left empty, defaults automatically to: <strong>Reliance@123</strong></p>
            </div>
          )}

          <div>
            <label className="label">Role <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => set('role', r)}
                  className={`py-2 rounded-input text-sm font-semibold border capitalize transition-all ${
                    form.role === r ? 'bg-forest-600 text-white border-forest-600' : 'bg-white text-muted border-border hover:border-forest-400'
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="relative">
            <label className="label">Dev Type <span className="text-red-500">*</span></label>
            
            {/* Custom dropdown trigger */}
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="input flex items-center justify-between cursor-pointer py-2 text-xs min-h-9 h-auto border border-border rounded-lg bg-white select-none"
            >
              <div className="flex flex-wrap gap-1">
                {selectedTypes.length === 0 ? (
                  <span className="text-muted">Select Dev Types</span>
                ) : (
                  selectedTypes.map(tech => (
                    <span key={tech} className="bg-forest-50 text-[#0D4F3C] text-[10px] font-bold px-2 py-0.5 rounded border border-forest-200 capitalize">
                      {tech}
                    </span>
                  ))
                )}
              </div>
              <ChevronDown size={14} className="text-muted shrink-0 ml-2" />
            </div>

            {/* Custom dropdown select popup */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-xl z-50 p-3 max-h-60 overflow-y-auto space-y-2.5 animate-in fade-in duration-100">
                <div className="space-y-1.5">
                  {availableDevTypes.map(tech => {
                    const isChecked = selectedTypes.includes(tech)
                    return (
                      <label key={tech} className="flex items-center gap-2 cursor-pointer text-xs text-charcoal select-none hover:bg-slate-50 p-1.5 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDevType(tech)}
                          className="checkbox rounded border-slate-300 text-forest-600 focus:ring-forest-500"
                        />
                        <span className="capitalize">{tech}</span>
                      </label>
                    )
                  })}
                </div>
                
                <div className="border-t border-border pt-2.5 flex gap-2">
                  <input
                    type="text"
                    className="input text-[11px] h-8 py-1"
                    placeholder="Add new (e.g. Go, Java)"
                    value={newTypeInput}
                    onChange={e => setNewTypeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCustomTech(e)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomTech()}
                    className="btn-outline text-[11px] h-8 px-2.5 shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted mt-1">Select one or more technologies from the list or add custom ones.</p>
          </div>

          {editUser && (
            <div className="flex items-center gap-3">
              <label className="label mb-0">Active Account</label>
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-forest-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-border">
          <button type="button" onClick={submit} disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={15} />}
            {editUser ? 'Save Changes' : 'Create Developer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (roleFilter) params.role = roleFilter
      const { data } = await api.get('/api/users', { params })
      setUsers(data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [roleFilter])

  const deactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return
    try {
      await api.delete(`/api/users/${id}`)
      toast.success('User deactivated successfully')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate user')
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="Developer Management" subtitle="Manage registered developers, roles and domain access">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9 w-64 text-sm"
              placeholder="Search by name or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="select w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
          {(search || roleFilter) && (
            <button onClick={() => { setSearch(''); setRoleFilter('') }} className="btn-ghost text-xs text-muted">
              <X size={12} /> Reset
            </button>
          )}
        </div>
        <button onClick={() => { setEditUser(null); setDrawerOpen(true) }} className="btn-primary">
          <Plus size={15} /> Add Developer
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto -mx-6">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  {['#', 'Developer', 'Email', 'Domain', 'Role', 'Dev Type', 'Status', 'Date Added', 'Actions'].map(h => (
                    <th key={h} className="table-cell text-left font-bold text-xs text-forest-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-cell text-center py-12">
                      <Users size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-muted text-sm">No users found</p>
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell text-muted text-xs">{i + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(u.full_name || u.username)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-charcoal text-sm">{u.full_name || u.username}</p>
                          <p className="text-xs text-muted">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-muted">{u.email || '—'}</td>
                    <td className="table-cell"><span className="badge-gray text-[10px]">{u.domain || '—'}</span></td>
                    <td className="table-cell"><RoleBadge role={u.role} /></td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(u.dev_type || '').split(',').map(s => s.trim()).filter(Boolean).map(tech => (
                          <span key={tech} className="badge-blue capitalize text-[10px] px-2 py-0.5 rounded-full">{tech}</span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${u.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-muted text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditUser(u); setDrawerOpen(true) }}
                          className="w-8 h-8 rounded-lg hover:bg-forest-50 flex items-center justify-center text-forest-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        {u.is_active ? (
                          <button
                            onClick={() => deactivate(u.id)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                            title="Deactivate"
                          >
                            <UserX size={14} />
                          </button>
                        ) : (
                          <button
                            className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-400 transition-colors"
                            title="Activate (edit user)"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted">Showing {filtered.length} of {users.length} users</p>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} editUser={editUser} onSaved={fetchUsers} />
    </Layout>
  )
}
