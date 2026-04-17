import { Bell, X, Check, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useCitasPendientes, updateEstadoCita } from '../../lib/hooks'
import { toast } from 'sonner'

interface NotificationPanelProps {
  userType: 'admin' | 'client'
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPanel({ userType, isOpen, onClose }: NotificationPanelProps) {
  const { pendientes, refetch } = useCitasPendientes()
  const [procesando, setProcesando] = useState<string | null>(null)

  const handleConfirmar = async (id: string, nombre: string) => {
    setProcesando(id)
    const { error } = await updateEstadoCita(id, 'confirmada')
    if (error) {
      toast.error('Error al confirmar la cita')
    } else {
      toast.success(`Cita de ${nombre} confirmada`)
      refetch()
    }
    setProcesando(null)
  }

  const handleRechazar = async (id: string, nombre: string) => {
    setProcesando(id)
    const { error } = await updateEstadoCita(id, 'cancelada')
    if (error) {
      toast.error('Error al rechazar la cita')
    } else {
      toast.warning(`Cita de ${nombre} rechazada`)
      refetch()
    }
    setProcesando(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
                {userType === 'admin' && pendientes.length > 0 && (
                  <p className="text-sm text-orange-600 font-medium">
                    {pendientes.length} cita{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de aprobación
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
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
                  {/* Section header */}
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
                        {/* Cita info */}
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{nombre}</p>
                            <p className="text-indigo-600 text-sm font-medium">{servicio}</p>
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
                          </div>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex-shrink-0">
                            Pendiente
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmar(cita.id, nombre)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleRechazar(cita.id, nombre)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 rounded-lg text-sm font-medium transition-all border border-red-200"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
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
            /* Client view: just info */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notificaciones</h3>
              <p className="text-sm text-gray-500">
                Recibirás notificaciones cuando el estado de tus citas cambie.
              </p>
            </div>
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
