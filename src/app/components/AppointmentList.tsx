import { Calendar, Clock, Edit, Trash2, CheckCircle, X, Filter } from 'lucide-react'
import { useState } from 'react'
import { useCitas, useCitasCliente, updateEstadoCita, deleteCita } from '../../lib/hooks'
import { useAuth } from '../../lib/AuthContext'
import { CitaEstado } from '../../lib/supabase'

interface AppointmentListProps {
  userType: 'admin' | 'client'
}

export default function AppointmentList({ userType }: AppointmentListProps) {
  const { user } = useAuth()
  const [filterStatus, setFilterStatus] = useState<CitaEstado | 'all'>('all')

  // Admin sees all citas; client sees only their own
  const adminQuery = useCitas(filterStatus)
  const clientQuery = useCitasCliente(userType === 'client' ? user?.id : undefined)

  const { citas, loading, refetch } = userType === 'admin' ? adminQuery : clientQuery

  const handleConfirm = async (id: string) => {
    const { error } = await updateEstadoCita(id, 'confirmada')
    if (!error) refetch()
    else alert('Error al confirmar la cita')
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    const { error } = await updateEstadoCita(id, 'cancelada')
    if (!error) refetch()
    else alert('Error al cancelar la cita')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cita permanentemente?')) return
    const { error } = await deleteCita(id)
    if (!error) refetch()
    else alert('Error al eliminar la cita')
  }

  const getStatusBadge = (estado: string | null) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      confirmada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmada' },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      cancelada: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
      completada: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completada' },
    }
    const badge = badges[estado ?? 'pendiente'] ?? badges['pendiente']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  // Client-side filter for client view (server-side for admin via hook)
  const filteredCitas = userType === 'client' && filterStatus !== 'all'
    ? citas.filter(c => c.estado === filterStatus)
    : citas

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {userType === 'admin' ? 'Todas las Citas' : 'Mis Citas'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredCitas.length} cita{filteredCitas.length !== 1 ? 's' : ''} encontrada{filteredCitas.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CitaEstado | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Todas</option>
            <option value="confirmada">Confirmadas</option>
            <option value="pendiente">Pendientes</option>
            <option value="cancelada">Canceladas</option>
            <option value="completada">Completadas</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">Cargando citas...</div>
        ) : filteredCitas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas</h3>
            <p className="text-gray-500">Prueba con otro filtro o agenda una nueva cita</p>
          </div>
        ) : filteredCitas.map((cita) => {
          const nombreCliente = cita.clientes?.nombre ?? cita.clientes?.email ?? 'Cliente'
          const servicio = cita.servicios?.nombre ?? 'Sin servicio'
          const fechaHora = cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio) : null

          return (
            <div key={cita.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {userType === 'admin' && (
                        <h3 className="font-semibold text-gray-900 mb-1">{nombreCliente}</h3>
                      )}
                      <h4 className="text-lg font-medium text-indigo-600">{servicio}</h4>
                    </div>
                    {getStatusBadge(cita.estado)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    {fechaHora && (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{fechaHora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                    <>
                      {userType === 'admin' && cita.estado === 'pendiente' && (
                        <button
                          onClick={() => handleConfirm(cita.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all font-medium text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                      )}

                      <button
                        onClick={() => handleCancel(cita.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </>
                  )}

                  {userType === 'admin' && (
                    <button
                      onClick={() => handleDelete(cita.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}

                  {(cita.estado === 'cancelada' || cita.estado === 'completada') && (
                    <div className="text-sm text-gray-400 italic">
                      {cita.estado === 'cancelada' ? 'Cancelada' : 'Completada'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
