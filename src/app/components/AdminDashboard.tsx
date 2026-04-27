import { Calendar, Users, CheckCircle, Clock, TrendingUp, MessageSquare, AlertCircle, XCircle, CalendarCheck } from 'lucide-react'
import { useAdminStats, useCitas, useCitasPendientes } from '../../lib/hooks'

export default function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats()
  const { citas: proximasCitas, loading: citasLoading } = useCitas()
  const { pendientes } = useCitasPendientes()

  const statsConfig = [
    { label: 'Citas Hoy', value: stats.citasHoy, icon: Calendar, color: 'bg-blue-500', textColor: 'text-blue-600', lightBg: 'bg-blue-50' },
    { label: 'Total Clientes', value: stats.totalClientes, icon: Users, color: 'bg-green-500', textColor: 'text-green-600', lightBg: 'bg-green-50' },
    { label: 'Completadas', value: stats.completadas, icon: CheckCircle, color: 'bg-purple-500', textColor: 'text-purple-600', lightBg: 'bg-purple-50' },
    { label: 'Pendientes', value: stats.pendientes, icon: Clock, color: 'bg-orange-500', textColor: 'text-orange-600', lightBg: 'bg-orange-50' },
  ]

  // Next 5 upcoming confirmed/pending appointments
  const upcoming = proximasCitas
    .filter(c => c.estado !== 'cancelada' && c.fecha_hora_inicio && new Date(c.fecha_hora_inicio) >= new Date())
    .slice(0, 5)

  // Occupation rate (confirmed / total non-cancelled)
  const totalActivas = stats.confirmadas + stats.pendientes + stats.completadas
  const ocupacionRate = totalActivas > 0
    ? Math.round((stats.confirmadas / totalActivas) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Alert for pending appointments */}
      {pendientes.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              {pendientes.length} cita{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de aprobación
            </p>
            <p className="text-xs text-orange-600 mt-0.5">Abre el panel de notificaciones (campana) para aprobarlas.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {statsLoading ? (
                      <span className="inline-block w-10 h-8 bg-gray-100 rounded animate-pulse" />
                    ) : stat.value}
                  </h3>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Próximas Citas</h3>
            {!citasLoading && (
              <span className="text-sm text-gray-400">{upcoming.length} próxima{upcoming.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {citasLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-32" />
                      <div className="h-3 bg-gray-100 rounded w-24" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              ))
            ) : upcoming.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No hay citas próximas</div>
            ) : upcoming.map((cita) => {
              const nombreCliente = cita.clientes?.nombre ?? cita.clientes?.email ?? 'Cliente'
              const servicio = cita.servicios?.nombre ?? 'Sin servicio'
              const hora = cita.fecha_hora_inicio
                ? new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                : '—'
              const fecha = cita.fecha_hora_inicio
                ? new Date(cita.fecha_hora_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : '—'
              const esHoy = cita.fecha_hora_inicio
                ? new Date(cita.fecha_hora_inicio).toDateString() === new Date().toDateString()
                : false

              return (
                <div key={cita.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {nombreCliente.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{nombreCliente}</h4>
                        <p className="text-sm text-gray-500">{servicio}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {esHoy ? <span className="text-indigo-600">Hoy</span> : fecha} · {hora}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                        cita.estado === 'confirmada'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {cita.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen General</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarCheck className="w-4 h-4 text-green-500" />
                  Confirmadas
                </div>
                <span className="font-semibold text-gray-900">
                  {statsLoading ? '—' : stats.confirmadas}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  Pendientes
                </div>
                <span className="font-semibold text-gray-900">
                  {statsLoading ? '—' : stats.pendientes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Completadas
                </div>
                <span className="font-semibold text-gray-900">
                  {statsLoading ? '—' : stats.completadas}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <XCircle className="w-4 h-4 text-red-400" />
                  Canceladas
                </div>
                <span className="font-semibold text-gray-900">
                  {statsLoading ? '—' : stats.canceladas}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Esta semana</span>
                  <span className="font-semibold text-indigo-600">{statsLoading ? '—' : stats.citasSemana}</span>
                </div>
              </div>

              {/* Occupation bar */}
              {!statsLoading && totalActivas > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Tasa de confirmación</span>
                    <span className="text-xs font-medium text-gray-700">{ocupacionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${ocupacionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sistema</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-xs text-gray-500">Supabase conectado</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-xs text-gray-500">Realtime activo</p>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-gray-300" />
                <p className="text-xs text-gray-400">WhatsApp no conectado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {stats.citasHoy === 0 ? 'Sin citas hoy' : `¿Todo listo para hoy?`}
            </h3>
            <p className="text-indigo-100">
              {stats.citasHoy === 0
                ? 'No tienes citas programadas para hoy.'
                : `Tienes ${stats.citasHoy} cita${stats.citasHoy !== 1 ? 's' : ''} programada${stats.citasHoy !== 1 ? 's' : ''} para hoy.`
              }
              {stats.pendientes > 0 && (
                <span className="ml-1 font-medium text-yellow-200">
                  · {stats.pendientes} pendiente{stats.pendientes !== 1 ? 's' : ''} de aprobar
                </span>
              )}
            </p>
          </div>
          <TrendingUp className="w-16 h-16 opacity-50" />
        </div>
      </div>
    </div>
  )
}
