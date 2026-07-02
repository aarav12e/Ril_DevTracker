import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/shared/LoadingSpinner'

// Lazy-loaded auth pages
const Login = lazy(() => import('./pages/auth/Login'))

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const ExcelUpload = lazy(() => import('./pages/admin/ExcelUpload'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const RoleConfig = lazy(() => import('./pages/admin/RoleConfig'))

// Lazy-loaded developer/intern pages
const DevDashboard = lazy(() => import('./pages/dev/DevDashboard'))
const MyLogs = lazy(() => import('./pages/dev/MyLogs'))
const LogEntryForm = lazy(() => import('./pages/dev/LogEntryForm'))


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
        <Suspense fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }>
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
            <Route path="/dev/edit/:id" element={
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
