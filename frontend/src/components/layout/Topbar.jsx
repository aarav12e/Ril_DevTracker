import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/api/notifications/unread-count')
      .then(r => setUnread(r.data.unread_count))
      .catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between flex-shrink-0">
      <div>
        {title && <h1 className="font-bold text-charcoal text-lg font-display leading-tight">{title}</h1>}
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted hidden md:block">{today}</span>
        <div className="relative">
          <button className="w-9 h-9 rounded-lg hover:bg-surface flex items-center justify-center text-muted transition-colors relative">
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
        <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-bold">
          {(user?.full_name || user?.username || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      </div>
    </header>
  )
}
