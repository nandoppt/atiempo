import { Bell, X, Check, Clock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { updateEstadoCita, useNotificacionesCliente } from '../../lib/hooks'
import { useAuth } from '../../lib/AuthContext'
import { Cita } from '../../lib/supabase'
import { toast } from 'sonner'

interface NotificationPanelProps {
  userType: 'admin' | 'client'
  isOpen: boolean
  onClose: () => void
  pendientes?: Cita[]
  loadingAdmin?: boolean
  refetchPendientes?: () => Promise<void>
}

export default function NotificationPanel({ userType, isOpen, onClose, pendientes = [], loadingAdmin = false, refetchPendientes }: NotificationPanelProps) {
  const { user } = useAuth()
  const [procesando, setProcesando] = useState<string | null>(null)

  const { 
    notificaciones, 
    loading: loadingNotif, 
    noLeidas, 
    marcarLeida 
  } = useNotificacionesCliente(userType === 'client' ? user?.id : undefined)

  // 2. Lógica de selección de datos
  const esAdmin = userType === 'admin'
  const datosAMostrar = esAdmin ? pendientes : notificaciones
  const totalCitas = esAdmin ? pendientes.length : noLeidas
  const estaCargando = esAdmin ? loadingAdmin : loadingNotif

  // Acciones para el Admin
  const handleAccion = async (id: string, nuevoEstado: 'confirmada' | 'cancelada', nombre: string) => {
    setProcesando(id)
    console.log(`[handleAccion] Calling updateEstadoCita for id ${id} with estado ${nuevoEstado}`)
    const { error } = await updateEstadoCita(id, nuevoEstado)
    if (error) {
      console.error(`[handleAccion] Error returned:`, error)
      toast.error(`Error al actualizar: ${error.message || 'Desconocido'}`)
    } else {
      console.log(`[handleAccion] Success! Now refetching...`)
      toast.success(nuevoEstado === 'confirmada' ? `Cita de ${nombre} aprobada` : 'Cita rechazada')
      await refetchPendientes?.()
      console.log(`[handleAccion] Refetch completed`)
    }
    setProcesando(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay para cerrar al hacer clic fuera */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Dinámico */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-gray-800">
              {esAdmin ? 'Solicitudes Pendientes' : 'Mis Notificaciones'} 
              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                {totalCitas}
              </span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-4">
          {estaCargando ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Cargando...</p>
            </div>
          ) : datosAMostrar.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Todo al día</p>
              <p className="text-xs text-gray-400 mt-1">
                {esAdmin ? 'No hay citas esperando aprobación' : 'No tienes avisos nuevos'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {esAdmin ? (
                // RENDER PARA ADMIN: Tarjetas de aprobación
                (datosAMostrar as any[]).map((cita) => {
                  const fechaObj = cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio) : null
                  return (
                    <div key={cita.id} className="border rounded-xl p-4 bg-white shadow-sm border-l-4 border-l-orange-400">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase text-orange-600 bg-orange-50 px-2 py-1 rounded">Pendiente</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fechaObj ? fechaObj.toLocaleDateString() : 'Fecha no disponible'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">{cita.clientes?.nombre || 'Cliente desconocido'}</p>
                      <p className="text-sm text-gray-600 mb-4">{cita.servicios?.nombre || 'Servicio'}</p>
                      
                      <div className="flex gap-2">
                        <button
                          disabled={procesando === cita.id}
                          onClick={() => handleAccion(cita.id, 'confirmada', cita.clientes?.nombre || 'Cliente')}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          {procesando === cita.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Aprobar
                        </button>
                        <button
                          disabled={procesando === cita.id}
                          onClick={() => handleAccion(cita.id, 'cancelada', cita.clientes?.nombre || 'Cliente')}
                          className="px-3 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 py-2 rounded-lg transition-colors"
                          title="Rechazar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                // RENDER PARA CLIENTE: Lista de historial
                (datosAMostrar as any[]).map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => marcarLeida(notif.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${notif.leida ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
                  >
                    <p className="text-sm text-gray-800">{notif.mensaje}</p>
                    <p className="text-[10px] text-gray-400 mt-2 italic">Toca para marcar como leída</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
            A Tiempo • Live Sync
          </p>
        </div>
      </div>
    </>
  )
}