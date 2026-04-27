import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, MessageSquare, Settings, LogOut, Bell, List, Clock } from 'lucide-react'
import { useState } from 'react'
import NotificationPanel from './NotificationPanel'
import { useAuth } from '../../lib/AuthContext'
import { useCitasPendientes } from '../../lib/hooks'

export default function AdminLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const { pendientes } = useCitasPendientes()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/calendar', icon: Calendar, label: 'Calendario' },
    { path: '/appointments', icon: List, label: 'Citas' },
    { path: '/chatbot', icon: MessageSquare, label: 'Chatbot' },
    { path: '/connections', icon: Settings, label: 'Conexiones' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">A tiempo</h1>
              <p className="text-xs text-gray-500">Panel Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    {/* Badge for pending on Citas */}
                    {item.path === '/appointments' && pendientes.length > 0 && (
                      <span className="ml-auto w-5 h-5 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                        {pendientes.length > 9 ? '9+' : pendientes.length}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          {user?.email && (
            <p className="text-xs text-gray-400 px-4 truncate">{user.email}</p>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Gestiona tus citas y configuraciones</p>
            </div>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Bell className="w-6 h-6" />
              {pendientes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {pendientes.length > 9 ? '9+' : pendientes.length}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      <NotificationPanel
        userType="admin"
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  )
}
