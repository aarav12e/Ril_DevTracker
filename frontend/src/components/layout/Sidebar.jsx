import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, ClipboardList, PlusCircle, BarChart2,
  Users, Upload, Settings, LogOut, Activity
} from 'lucide-react'

const adminNav = [
  { to: '/admin',        label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/admin/logs',   label: 'All Logs',    icon: ClipboardList },
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
    admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    developer: 'bg-emerald-100 text-emerald-700',
    intern: 'bg-amber-100 text-amber-700',
  }[user?.role] || 'bg-slate-100 text-slate-600'

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-border flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-forest-600 flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-charcoal text-sm font-display leading-tight">DevTracker</p>
            <p className="text-[10px] text-muted leading-tight">H.N. Reliance Hospital</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 mb-2">Menu</p>
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors">
          <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-charcoal truncate">{user?.full_name || user?.username}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeColor}`}>
              {user?.role}
            </span>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} className="text-muted hover:text-red-500 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
