import { Calendar, Clock, Trash2, CheckCircle, X, Filter, AlertTriangle, Loader2, User, Edit } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCitas, useCitasCliente, updateEstadoCita, deleteCita, updateCita } from '../../lib/hooks'
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
  const [procesando, setProcesando] = useState<string | null>(null)
  const [editingCitaId, setEditingCitaId] = useState<string | null>(null)
  const [editFecha, setEditFecha] = useState('')
  const [editHora, setEditHora] = useState('')

  const adminQuery = useCitas(filterStatus)
  const clientQuery = useCitasCliente(userType === 'client' ? user?.id : undefined)
  const { citas, loading, refetch } = userType === 'admin' ? adminQuery : clientQuery

  // For client side, filter locally since hook fetches all client citas
  const filteredCitas = userType === 'client' && filterStatus !== 'all'
    ? citas.filter(c => c.estado === filterStatus)
    : citas

  const handleConfirm = async (id: string, nombreCliente: string) => {
    setProcesando(id)
    const { error } = await updateEstadoCita(id, 'confirmada')
    if (error) {
      toast.error('Error al confirmar la cita')
    } else {
      toast.success(`Cita de ${nombreCliente} confirmada ✓`)
      await refetch()
    }
    setProcesando(null)
  }

  const handleCancel = async (id: string, nombreCliente: string) => {
    setProcesando(id)
    const { error } = await updateEstadoCita(id, 'cancelada')
    if (error) {
      toast.error('Error al cancelar la cita')
    } else {
      toast.warning(userType === 'client' ? 'Cita cancelada' : `Cita de ${nombreCliente} cancelada`)
      await refetch()
    }
    setProcesando(null)
  }

  const handleDelete = async (id: string) => {
    setProcesando(id)
    const { error } = await deleteCita(id)
    setConfirmDelete(null)
    if (error) {
      toast.error('Error al eliminar la cita')
    } else {
      toast.success('Cita eliminada correctamente')
      await refetch()
    }
    setProcesando(null)
  }

  const handleStartEdit = (cita: any) => {
    setEditingCitaId(cita.id)
    setEditFecha(cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio).toISOString().slice(0, 10) : '')
    setEditHora(cita.fecha_hora_inicio
      ? new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
      : '')
  }

  const handleCancelEdit = () => {
    setEditingCitaId(null)
    setEditFecha('')
    setEditHora('')
  }

  const handleSaveEdit = async (id: string, nombreCliente: string) => {
    if (!editFecha || !editHora) {
      toast.error('Selecciona fecha y hora para reagendar')
      return
    }

    const newDate = new Date(`${editFecha}T${editHora}:00`)
    if (newDate <= new Date()) {
      toast.error('No puedes agendar una cita en el pasado')
      return
    }

    const hour = newDate.getHours()
    if (hour < 8 || hour >= 18) {
      toast.error('El horario de atención es de 8:00 a 18:00')
      return
    }

    setProcesando(id)
    const { error } = await updateCita(id, newDate.toISOString())
    if (error) {
      toast.error('Error al reagendar la cita')
    } else {
      toast.success(`Cita de ${nombreCliente} reagendada`) 
      await refetch()
      handleCancelEdit()
    }
    setProcesando(null)
  }

  const getStatusBadge = (estado: string | null) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      confirmada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmada' },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      cancelada: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
      completada: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completada' },
    }
    const badge = map[estado ?? 'pendiente'] ?? map['pendiente']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  // Count by status for quick filter summary
  const counts = {
    all: citas.length,
    pendiente: citas.filter(c => c.estado === 'pendiente').length,
    confirmada: citas.filter(c => c.estado === 'confirmada').length,
    cancelada: citas.filter(c => c.estado === 'cancelada').length,
    completada: citas.filter(c => c.estado === 'completada').length,
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
            {counts.pendiente > 0 && userType === 'admin' && (
              <span className="ml-2 text-orange-600 font-medium">
                · {counts.pendiente} pendiente{counts.pendiente !== 1 ? 's' : ''} de aprobación
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as CitaEstado | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
          >
            <option value="all">Todas ({counts.all})</option>
            <option value="pendiente">Pendientes ({counts.pendiente})</option>
            <option value="confirmada">Confirmadas ({counts.confirmada})</option>
            <option value="cancelada">Canceladas ({counts.cancelada})</option>
            <option value="completada">Completadas ({counts.completada})</option>
          </select>
          {userType === 'client' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              + Nueva Cita
            </button>
          )}
          {userType === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              + Nueva Cita
            </button>
          )}
        </div>
      </div>

      {/* Quick filter pills */}
      {counts.pendiente > 0 && userType === 'admin' && (
        <button
          onClick={() => setFilterStatus('pendiente')}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            filterStatus === 'pendiente'
              ? 'bg-orange-50 border-orange-300'
              : 'bg-white border-orange-200 hover:border-orange-300 hover:bg-orange-50'
          }`}
        >
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="font-medium text-orange-800">
              {counts.pendiente} cita{counts.pendiente !== 1 ? 's' : ''} esperando aprobación
            </p>
            <p className="text-sm text-orange-600">
              {filterStatus === 'pendiente' ? 'Mostrando solo pendientes ↓' : 'Clic para filtrar y gestionar →'}
            </p>
          </div>
        </button>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando citas...
          </div>
        ) : filteredCitas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay citas</h3>
            <p className="text-gray-400 text-sm">
              {filterStatus !== 'all' ? 'Prueba con otro filtro' : 'Aún no hay citas registradas'}
            </p>
          </div>
        ) : filteredCitas.map((cita) => {
          const nombreCliente = cita.clientes?.nombre ?? cita.clientes?.email ?? 'Cliente'
          const servicio = cita.servicios?.nombre ?? 'Sin servicio'
          const duracion = cita.servicios?.duracion_minutos
          const fechaHora = cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio) : null
          const isActive = cita.estado !== 'cancelada' && cita.estado !== 'completada'
          const isPendiente = cita.estado === 'pendiente'
          const isProcessing = procesando === cita.id
          const isPast = fechaHora ? fechaHora < new Date() : false

          return (
            <div
              key={cita.id}
              className={`bg-white rounded-xl shadow-sm border transition-all ${
                isPendiente && userType === 'admin'
                  ? 'border-orange-200 shadow-orange-50'
                  : 'border-gray-100'
              } ${isProcessing ? 'opacity-70' : 'hover:shadow-md'}`}
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {userType === 'admin' && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {nombreCliente.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          {userType === 'admin' && (
                            <p className="font-semibold text-gray-900 truncate">{nombreCliente}</p>
                          )}
                          <p className="text-indigo-600 font-medium text-sm">{servicio}</p>
                          {duracion && (
                            <p className="text-xs text-gray-400">{duracion} min</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(cita.estado)}
                    </div>

                    {fechaHora && (
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {fechaHora.toLocaleDateString('es-ES', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })}
                          {isPast && <span className="text-xs text-gray-400">(pasada)</span>}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {userType === 'admin' && cita.clientes?.telefono && (
                          <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {cita.clientes.telefono}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap lg:flex-col gap-2 lg:min-w-[140px]">
                    {isActive && (
                      <>
                        {/* CONFIRM — admin only, only for pending */}
                        {userType === 'admin' && isPendiente && (
                          <button
                            onClick={() => handleConfirm(cita.id, nombreCliente)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {isProcessing
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <CheckCircle className="w-4 h-4" />
                            }
                            Confirmar
                          </button>
                        )}

                        {/* CANCEL */}
                        <button
                          onClick={() => handleCancel(cita.id, nombreCliente)}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 active:bg-orange-200 transition-all text-sm font-medium border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <X className="w-4 h-4" />
                          }
                          Cancelar
                        </button>

                        {userType === 'admin' && (
                          <button
                            onClick={() => handleStartEdit(cita)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200"
                          >
                            <Edit className="w-4 h-4" />
                            Reagendar
                          </button>
                        )}
                      </>
                    )}

                    {/* DELETE — admin only */}
                    {userType === 'admin' && (
                      confirmDelete === cita.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(cita.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium disabled:opacity-50"
                          >
                            {isProcessing
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <AlertTriangle className="w-3 h-3" />
                            }
                            Eliminar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs font-medium"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(cita.id)}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-all text-sm font-medium border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {editingCitaId === cita.id && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 bg-gray-50">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha</label>
                      <input
                        type="date"
                        value={editFecha}
                        onChange={(e) => setEditFecha(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nueva hora</label>
                      <input
                        type="time"
                        value={editHora}
                        onChange={(e) => setEditHora(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cita.id, nombreCliente)}
                      disabled={procesando === cita.id}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {procesando === cita.id ? 'Guardando...' : 'Guardar cambio'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Pending highlight bar */}
              {isPendiente && userType === 'admin' && !isProcessing && (
                <div className="px-5 py-2.5 bg-orange-50 border-t border-orange-100 rounded-b-xl">
                  <p className="text-xs text-orange-600 font-medium">
                    ⏳ Esperando tu aprobación — confirma o cancela esta cita
                  </p>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="px-5 py-2 bg-indigo-50 border-t border-indigo-100 rounded-b-xl">
                  <p className="text-xs text-indigo-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Procesando...
                  </p>
                </div>
              )}
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
