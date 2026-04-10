import { Calendar, Clock, CheckCircle, Plus, Bell } from 'lucide-react'
import { useCitasCliente } from '../../lib/hooks'
import { useAuth } from '../../lib/AuthContext'

export default function ClientDashboard() {
  const { user } = useAuth()
  const { citas, loading } = useCitasCliente(user?.id)

  const nombre = user?.user_metadata?.nombre ?? user?.email?.split('@')[0] ?? 'Cliente'

  const upcoming = citas.filter(c =>
    c.estado !== 'cancelada' &&
    c.fecha_hora_inicio &&
    new Date(c.fecha_hora_inicio) >= new Date()
  )

  const past = citas.filter(c =>
    c.estado === 'completada' ||
    (c.fecha_hora_inicio && new Date(c.fecha_hora_inicio) < new Date())
  )

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">¡Hola, {nombre}!</h2>
        <p className="text-indigo-100 mb-6">Aquí puedes gestionar tus citas de manera fácil y rápida</p>
        <button className="bg-white text-indigo-600 font-medium px-6 py-3 rounded-lg hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-md">
          <Plus className="w-5 h-5" />
          Agendar Nueva Cita
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Próximas Citas</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : upcoming.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completadas</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : past.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-lg p-3">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total citas</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : citas.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Próximas Citas</h3>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <p className="text-center text-gray-400 text-sm">Cargando...</p>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes citas programadas</p>
            </div>
          ) : upcoming.map((cita) => {
            const fechaHora = cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio) : null
            const servicio = cita.servicios?.nombre ?? 'Sin servicio'
            return (
              <div key={cita.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-100 rounded-lg p-3">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{servicio}</h4>
                      {fechaHora && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {fechaHora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    cita.estado === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cita.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Historial</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {past.map((cita) => {
              const fechaHora = cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio) : null
              const servicio = cita.servicios?.nombre ?? 'Sin servicio'
              return (
                <div key={cita.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{servicio}</h4>
                        {fechaHora && (
                          <p className="text-sm text-gray-500">
                            {fechaHora.toLocaleDateString('es-ES')} - {fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{cita.estado}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
