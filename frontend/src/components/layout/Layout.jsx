import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children, title, subtitle }) {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto p-6 page-transition"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
