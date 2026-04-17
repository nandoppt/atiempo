import { Calendar, Clock, Trash2, CheckCircle, X, Filter, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCitas, useCitasCliente, updateEstadoCita, deleteCita } from '../../lib/hooks'
import { useAuth } from '../../lib/AuthContext'
import { CitaEstado } from '../../lib/supabase'
import NuevaCitaModal from './NuevaCitaModal'

interface AppointmentListProps {
  userType: 'admin' | 'client'
}

export default function AppointmentList({ userType }: AppointmentListProps) {
  const { user } = useAuth()
  const [filterStatus, setFilterStatus] = useState<CitaEstado | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const adminQuery = useCitas(filterStatus)
  const clientQuery = useCitasCliente(userType === 'client' ? user?.id : undefined)
  const { citas, loading, refetch } = userType === 'admin' ? adminQuery : clientQuery

  const handleConfirm = async (id: string, nombreCliente: string) => {
    const { error } = await updateEstadoCita(id, 'confirmada')
    if (error) toast.error('Error al confirmar la cita')
    else toast.success(`Cita de ${nombreCliente} confirmada ✓`)
  }

  const handleCancel = async (id: string, nombreCliente: string) => {
    const { error } = await updateEstadoCita(id, 'cancelada')
    if (error) toast.error('Error al cancelar la cita')
    else toast.warning(`Cita ${userType === 'client' ? 'cancelada' : `de ${nombreCliente} cancelada`}`)
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteCita(id)
    setConfirmDelete(null)
    if (error) toast.error('Error al eliminar la cita')
    else toast.success('Cita eliminada correctamente')
  }

  const filteredCitas = userType === 'client' && filterStatus !== 'all'
    ? citas.filter(c => c.estado === filterStatus)
    : citas

  const getStatusBadge = (estado: string | null) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      confirmada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmada' },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      cancelada: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
      completada: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completada' },
    }
    const badge = map[estado ?? 'pendiente'] ?? map['pendiente']
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
  }

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as CitaEstado | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="all">Todas</option>
              <option value="confirmada">Confirmadas</option>
              <option value="pendiente">Pendientes</option>
              <option value="cancelada">Canceladas</option>
              <option value="completada">Completadas</option>
            </select>
          </div>
          {userType === 'client' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              + Nueva Cita
            </button>
          )}
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
            <p className="text-gray-500">Prueba con otro filtro</p>
          </div>
        ) : filteredCitas.map((cita) => {
          const nombreCliente = cita.clientes?.nombre ?? cita.clientes?.email ?? 'Cliente'
          const servicio = cita.servicios?.nombre ?? 'Sin servicio'
          const fechaHora = cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio) : null
          const isActive = cita.estado !== 'cancelada' && cita.estado !== 'completada'

          return (
            <div key={cita.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {userType === 'admin' && (
                        <h3 className="font-semibold text-gray-900 mb-0.5">{nombreCliente}</h3>
                      )}
                      <h4 className="text-base font-medium text-indigo-600">{servicio}</h4>
                    </div>
                    {getStatusBadge(cita.estado)}
                  </div>

                  {fechaHora && (
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {fechaHora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap lg:flex-col gap-2">
                  {isActive && (
                    <>
                      {userType === 'admin' && cita.estado === 'pendiente' && (
                        <button
                          onClick={() => handleConfirm(cita.id, nombreCliente)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all text-sm font-medium border border-green-200"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(cita.id, nombreCliente)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-all text-sm font-medium border border-orange-200"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </>
                  )}

                  {userType === 'admin' && (
                    confirmDelete === cita.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(cita.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-xs font-medium"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all text-xs font-medium"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(cita.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-medium border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <NuevaCitaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
