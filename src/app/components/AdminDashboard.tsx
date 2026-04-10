import { Calendar, Users, CheckCircle, Clock, TrendingUp, MessageSquare } from 'lucide-react'
import { useAdminStats, useCitas } from '../../lib/hooks'

export default function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats()
  const { citas: proximasCitas, loading: citasLoading } = useCitas()

  const statsConfig = [
    { label: 'Citas Hoy', value: stats.citasHoy, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Total Clientes', value: stats.totalClientes, icon: Users, color: 'bg-green-500' },
    { label: 'Completadas', value: stats.completadas, icon: CheckCircle, color: 'bg-purple-500' },
    { label: 'Pendientes', value: stats.pendientes, icon: Clock, color: 'bg-orange-500' },
  ]

  // Show only next 5 upcoming appointments
  const upcoming = proximasCitas
    .filter(c => c.estado !== 'cancelada' && c.fecha_hora_inicio && new Date(c.fecha_hora_inicio) >= new Date())
    .slice(0, 5)

  return (
    <div className="space-y-6">
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
                    {statsLoading ? '—' : stat.value}
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
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Próximas Citas</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {citasLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm">Cargando citas...</div>
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
                      <p className="font-medium text-gray-900">{fecha} · {hora}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                        cita.estado === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
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

        {/* Info panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sistema conectado</p>
                <p className="text-xs text-gray-400 mt-0.5">Datos en tiempo real desde Supabase</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">¿Todo listo para hoy?</h3>
            <p className="text-indigo-100">
              Tienes {stats.citasHoy} cita{stats.citasHoy !== 1 ? 's' : ''} programada{stats.citasHoy !== 1 ? 's' : ''} para hoy.
            </p>
          </div>
          <TrendingUp className="w-16 h-16 opacity-50" />
        </div>
      </div>
    </div>
  )
}
