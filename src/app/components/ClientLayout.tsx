import { Outlet, Link, useLocation } from 'react-router-dom'
import { Calendar, LogOut, Bell, Clock } from 'lucide-react'
import { useState } from 'react'
import NotificationPanel from './NotificationPanel'
import { useAuth } from '../../lib/AuthContext'
import { useNotificacionesCliente } from '../../lib/hooks'

export default function ClientLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const { noLeidas } = useNotificacionesCliente(user?.id)

  const navItems = [
    { path: '/', icon: Clock, label: 'Inicio' },
    { path: '/appointments', icon: Calendar, label: 'Mis Citas' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">A tiempo</h1>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-4">
              {user?.email && (
                <span className="hidden sm:block text-xs text-gray-400">{user.email}</span>
              )}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Bell className="w-6 h-6" />
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-200">
          <nav className="flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 ${
                    isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      <NotificationPanel
        userType="client"
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  )
}
