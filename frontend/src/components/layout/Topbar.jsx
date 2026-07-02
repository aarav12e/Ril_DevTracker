import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const fetchUnreadCount = () => {
    api.get('/api/notifications/unread-count')
      .then(r => setUnread(r.data.unread_count))
      .catch(() => {})
  }

  useEffect(() => {
    fetchUnreadCount()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications')
      setNotifications(data)
    } catch {}
  }

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
    } catch {}
  }

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
          <button onClick={toggleDropdown} className="w-9 h-9 rounded-lg hover:bg-surface flex items-center justify-center text-muted transition-colors relative">
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-border shadow-lg py-2 z-50 max-h-[400px] overflow-y-auto">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="font-bold text-xs text-charcoal">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] text-forest-600 font-semibold hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted">
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`px-4 py-3 hover:bg-surface cursor-pointer transition-colors ${!n.is_read ? 'bg-forest-50/30' : ''}`}
                    >
                      <p className={`text-xs text-charcoal ${!n.is_read ? 'font-semibold' : ''}`}>{n.message}</p>
                      <span className="text-[9px] text-muted block mt-1">
                        {new Date(n.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-bold font-display">
          {(user?.full_name || user?.username || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      </div>
    </header>
  )
}
