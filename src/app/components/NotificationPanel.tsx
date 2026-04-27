import { Bell, X, Check, Calendar, Clock, AlertCircle, Loader2, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useCitasPendientes, updateEstadoCita, useNotificacionesCliente } from '../../lib/hooks'
import { useAuth } from '../../lib/AuthContext'
import { toast } from 'sonner'

interface NotificationPanelProps {
  userType: 'admin' | 'client'
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPanel({ userType, isOpen, onClose }: NotificationPanelProps) {
  const { user } = useAuth()

  // Admin: pending appointments to approve
  const { pendientes, refetch: refetchPendientes } = useCitasPendientes()
  const [procesando, setProcesando] = useState<string | null>(null)

  // Client: notification history
  const { notificaciones, loading: loadingNotif, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificacionesCliente(
    userType === 'client' ? user?.id : undefined
  )

  const handleConfirmar = async (id: string, nombre: string) => {
    setProcesando(id)
    const { error } = await updateEstadoCita(id, 'confirmada')
    if (error) toast.error('Error al confirmar la cita')
    else { toast.success(`Cita de ${nombre} confirmada`); refetchPendientes() }
    setProcesando(null)
  }

  const handleRechazar = async (id: string, nombre: string) => {
    setProcesando(id)
    const { error } = await updateEstadoCita(id, 'cancelada')
    if (error) toast.error('Error al rechazar la cita')
    else { toast.warning(`Cita de ${nombre} rechazada`); refetchPendientes() }
    setProcesando(null)
  }

  if (!isOpen) return null

  const tipoConfig: Record<string, { icon: string; color: string; bg: string }> = {
    confirmada: { icon: '✅', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    cancelada: { icon: '❌', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    pendiente: { icon: '⏳', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
    recordatorio: { icon: '⏰', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    completada: { icon: '🎉', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2 relative">
                <Bell className="w-5 h-5 text-indigo-600" />
                {userType === 'admin' && pendientes.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {pendientes.length > 9 ? '9+' : pendientes.length}
                  </span>
                )}
                {userType === 'client' && noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
                {userType === 'admin' && pendientes.length > 0 && (
                  <p className="text-sm text-orange-600 font-medium">
                    {pendientes.length} cita{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de aprobación
                  </p>
                )}
                {userType === 'client' && noLeidas > 0 && (
                  <p className="text-sm text-indigo-600 font-medium">
                    {noLeidas} sin leer
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {userType === 'client' && noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {userType === 'admin' ? (
            <>
              {pendientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="bg-green-100 rounded-full p-4 mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Todo al día</h3>
                  <p className="text-sm text-gray-500">No hay citas pendientes de aprobación</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="px-6 py-3 bg-orange-50 border-b border-orange-100">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <p className="text-sm font-medium text-orange-700">Requieren tu aprobación</p>
                    </div>
                  </div>

                  {pendientes.map((cita) => {
                    const nombre = cita.clientes?.nombre ?? cita.clientes?.email ?? 'Cliente'
                    const servicio = cita.servicios?.nombre ?? 'Sin servicio'
                    const fechaHora = cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio) : null
                    const isProcessing = procesando === cita.id

                    return (
                      <div key={cita.id} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{nombre}</p>
                            <p className="text-indigo-600 text-sm font-medium">{servicio}</p>
                            {cita.clientes?.telefono && (
                              <p className="text-xs text-gray-400">{cita.clientes.telefono}</p>
                            )}
                            {fechaHora && (
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {fechaHora.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  {fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                            {cita.servicios?.duracion_minutos && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Duración: {cita.servicios.duracion_minutos} min
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex-shrink-0">
                            Pendiente
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmar(cita.id, nombre)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleRechazar(cita.id, nombre)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 rounded-lg text-sm font-medium transition-all border border-red-200"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Rechazar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            /* Client notifications */
            loadingNotif ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin notificaciones</h3>
                <p className="text-sm text-gray-500">
                  Aquí aparecerán los cambios en el estado de tus citas.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notificaciones.map(n => {
                  const config = tipoConfig[n.tipo] ?? tipoConfig['pendiente']
                  const fecha = new Date(n.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })

                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.leida && marcarLeida(n.id)}
                      className={`p-4 transition-colors cursor-pointer ${
                        n.leida ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${n.leida ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                            {n.mensaje}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{fecha}</p>
                        </div>
                        {!n.leida && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Actualización en tiempo real activa
          </p>
        </div>
      </div>
    </>
  )
}
