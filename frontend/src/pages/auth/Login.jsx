import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Activity, Shield, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.username, form.password)
      if (data.role === 'admin' || data.role === 'manager') navigate('/admin')
      else navigate('/dev')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex w-[58%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b52 50%, #0a3d2e 100%)' }}
      >
        {/* Hexagon pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Top badge */}
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold tracking-wide uppercase">Internal System · Authorized Access Only</span>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          {/* Logo circle */}
          <div className="w-20 h-20 rounded-2xl bg-gold-400/20 border border-gold-400/40 flex items-center justify-center">
            <Activity size={36} className="text-gold-400" />
          </div>

          <div>
            <p className="text-white/60 text-sm font-semibold tracking-widest uppercase mb-3">H.N. Reliance Hospital, Mumbai</p>
            <h1 className="font-display font-bold text-5xl text-white leading-tight mb-2">
              Track.<br />
              <span className="text-gold-400">Build.</span><br />
              Deliver.
            </h1>
            <p className="text-white/60 text-base mt-4">Internal Development Management System</p>
          </div>

          {/* Stats */}
          <div className="flex gap-10">
            {[['12', 'Active Teams'], ['340+', 'Sprints Logged'], ['99.8%', 'Uptime']].map(([val, label]) => (
              <div key={label}>
                <p className="text-white font-bold text-2xl font-display">{val}</p>
                <p className="text-white/50 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Sprint Tracking', 'Build Pipelines', 'Release Management', 'Team Analytics'].map(f => (
              <span key={f} className="bg-white/10 border border-white/20 text-white/80 text-xs px-3 py-1.5 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between">
          <p className="text-white/40 text-xs">A Reliance Industries Initiative</p>
          <p className="text-white/30 text-xs">© 2026 RIL</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-bold font-display text-charcoal">DevTracker</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-charcoal">Welcome Back</h2>
            <p className="text-muted text-sm mt-1">Sign in with your Reliance credentials</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                placeholder="your.username"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal transition-colors"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-forest-600 rounded" />
                <span className="text-sm text-muted">Keep me signed in</span>
              </label>
              <button type="button" className="text-sm text-forest-600 font-medium hover:text-gold-400 transition-colors">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 text-white font-semibold py-3 rounded-btn hover:bg-forest-700 active:bg-forest-800 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed font-display text-sm"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Domain warning */}
          <div className="mt-6 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <Shield size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Access restricted to <span className="font-semibold">@reliancehospital.com</span> domains only.
              Unauthorized access attempts are logged and reported.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button className="text-xs text-muted hover:text-forest-600 transition-colors">
              Need help? <span className="text-forest-600 font-medium">Contact IT Support</span>
            </button>
            <span className="text-xs text-slate-300">v2.4.1 · build 20240619</span>
          </div>
        </div>
      </div>
    </div>
  )
}
