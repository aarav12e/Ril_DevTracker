import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-forest-600/20 border-t-forest-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted">Loading DevTracker...</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin' || user.role === 'manager') return <Navigate to="/admin" replace />
    return <Navigate to="/dev" replace />
  }

  return children
}
