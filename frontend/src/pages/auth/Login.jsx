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
      {/* ── Left panel — Hospital Image ── */}
      <div className="hidden lg:block w-[55%] relative overflow-hidden">
        <img
          src="/loginpage.png"
          alt="Sir H.N. Reliance Foundation Hospital"
          className="absolute inset-0 w-full h-full object-cover object-left"
        />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10" />
        {/* Bottom tag */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-white/40 rounded-xl px-5 py-3 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-charcoal text-sm font-display">DevTracker</p>
              <p className="text-[10px] text-muted">Internal Development Management System</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — Login Form ── */}
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
