import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, ClipboardList, PlusCircle, BarChart2,
  Users, Upload, Settings, LogOut, Activity
} from 'lucide-react'

const adminNav = [
  { to: '/admin',        label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/admin/users',  label: 'Developers',  icon: Users },
  { to: '/admin/upload', label: 'Upload Excel', icon: Upload },
  { to: '/admin/reports',label: 'Reports',     icon: BarChart2 },
  { to: '/admin/config', label: 'Settings',    icon: Settings },
]

const devNav = [
  { to: '/dev',          label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/dev/logs',     label: 'My Logs',      icon: ClipboardList },
  { to: '/dev/add',      label: 'Add Log',      icon: PlusCircle },
  { to: '/dev/upload',   label: 'Upload Excel', icon: Upload },
  { to: '/dev/reports',  label: 'My Reports',   icon: BarChart2 },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin' || user?.role === 'manager'
  const nav = isAdmin ? adminNav : devNav

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const roleBadgeColor = {
    admin: 'bg-purple-900/50 text-purple-200 border border-purple-800/30',
    manager: 'bg-blue-900/50 text-blue-200 border border-blue-800/30',
    developer: 'bg-emerald-900/50 text-emerald-200 border border-emerald-800/30',
    intern: 'bg-amber-900/50 text-amber-200 border border-amber-800/30',
  }[user?.role] || 'bg-slate-800 text-slate-300'

  return (
    <aside className="w-60 min-h-screen bg-forest-600 text-slate-100 border-r border-forest-700 flex flex-col shadow-lg relative overflow-hidden">
      {/* Subtle brand gradient blur overlay for high-end look */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#1a6b52]/30 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
            <Activity size={18} className="text-gold-300" />
          </div>
          <div>
            <p className="font-bold text-white text-sm font-display leading-tight">DevTracker</p>
            <p className="text-[10px] text-gold-300 font-medium leading-tight">H.N. Reliance Hospital</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 relative z-10">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">Menu</p>
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="px-3 py-4 border-t border-white/10 relative z-10">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-forest-700/40 border border-white/5 shadow-inner">
          <div className="w-8 h-8 rounded-full bg-gold-400 text-forest-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username}</p>
            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 ${roleBadgeColor}`}>
              {user?.role}
            </span>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} className="text-white/40 hover:text-red-400 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
