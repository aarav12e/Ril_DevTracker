import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Auth pages
import Login from './pages/auth/Login'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLogs from './pages/admin/AdminLogs'
import UserManagement from './pages/admin/UserManagement'
import ExcelUpload from './pages/admin/ExcelUpload'
import Reports from './pages/admin/Reports'
import RoleConfig from './pages/admin/RoleConfig'

// Developer / Intern pages
import DevDashboard from './pages/dev/DevDashboard'
import MyLogs from './pages/dev/MyLogs'
import LogEntryForm from './pages/dev/LogEntryForm'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin' || user.role === 'manager') return <Navigate to="/admin" replace />
  return <Navigate to="/dev" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin','manager']}><AdminDashboard /></ProtectedRoute>
          }/>
          <Route path="/admin/logs" element={
            <ProtectedRoute roles={['admin','manager']}><AdminLogs /></ProtectedRoute>
          }/>
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin','manager']}><UserManagement /></ProtectedRoute>
          }/>
          <Route path="/admin/upload" element={
            <ProtectedRoute roles={['admin','manager']}><ExcelUpload /></ProtectedRoute>
          }/>
          <Route path="/admin/reports" element={
            <ProtectedRoute roles={['admin','manager']}><Reports /></ProtectedRoute>
          }/>
          <Route path="/admin/config" element={
            <ProtectedRoute roles={['admin']}><RoleConfig /></ProtectedRoute>
          }/>

          {/* Developer / Intern routes */}
          <Route path="/dev" element={
            <ProtectedRoute roles={['developer','intern']}><DevDashboard /></ProtectedRoute>
          }/>
          <Route path="/dev/logs" element={
            <ProtectedRoute roles={['developer','intern']}><MyLogs /></ProtectedRoute>
          }/>
          <Route path="/dev/add" element={
            <ProtectedRoute roles={['developer','intern']}><LogEntryForm /></ProtectedRoute>
          }/>
          <Route path="/dev/upload" element={
            <ProtectedRoute roles={['developer','intern']}><ExcelUpload /></ProtectedRoute>
          }/>
          <Route path="/dev/reports" element={
            <ProtectedRoute roles={['developer','intern']}><Reports /></ProtectedRoute>
          }/>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
