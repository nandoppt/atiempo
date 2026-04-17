import { useState } from 'react'
import { X, Loader2, CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useServicios } from '../../lib/hooks'
import { useAuth } from '../../lib/AuthContext'

interface NuevaCitaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clienteId?: string
}

export default function NuevaCitaModal({ isOpen, onClose, onSuccess, clienteId }: NuevaCitaModalProps) {
  const { user, role } = useAuth()
  const { servicios, loading: serviciosLoading } = useServicios(true)

  const [servicioId, setServicioId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const resolvedClienteId = clienteId ?? user?.id

  const handleClose = () => {
    setServicioId('')
    setFecha('')
    setHora('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resolvedClienteId) {
      toast.error('No se pudo identificar el cliente')
      return
    }
    if (!servicioId) {
      toast.error('Selecciona un servicio')
      return
    }
    if (!fecha || !hora) {
      toast.error('Selecciona fecha y hora')
      return
    }

    // Validate date is not in the past
    const selectedDate = new Date(`${fecha}T${hora}:00`)
    if (selectedDate < new Date()) {
      toast.error('No puedes agendar una cita en el pasado')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('citas').insert({
      cliente_id: resolvedClienteId,
      servicio_id: servicioId,
      fecha_hora_inicio: selectedDate.toISOString(),
      estado: role === 'admin' ? 'confirmada' : 'pendiente',
      fecha_creacion: new Date().toISOString(),
    })

    setLoading(false)

    if (error) {
      toast.error(`Error al agendar: ${error.message}`)
    } else {
      const servicioNombre = servicios.find(s => s.id === servicioId)?.nombre ?? 'Cita'
      if (role === 'admin') {
        toast.success(`${servicioNombre} agendada y confirmada para el ${new Date(`${fecha}T${hora}`).toLocaleDateString('es-ES')}`)
      } else {
        toast.success('Cita enviada. Espera la confirmación del administrador.')
      }
      onSuccess()
      handleClose()
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 rounded-lg p-2">
              <CalendarPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nueva Cita</h2>
              {role === 'cliente' && (
                <p className="text-xs text-gray-500 mt-0.5">Quedará pendiente de aprobación</p>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
            {serviciosLoading ? (
              <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
            ) : servicios.length === 0 ? (
              <p className="text-sm text-red-500 py-3">No hay servicios disponibles. Contacta al administrador.</p>
            ) : (
              <select
                value={servicioId}
                onChange={e => setServicioId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white text-sm"
                required
              >
                <option value="">Selecciona un servicio…</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}{s.duracion_minutos ? ` · ${s.duracion_minutos} min` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              min={today}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              required
            />
          </div>

          {/* Hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
            <input
              type="time"
              value={hora}
              onChange={e => setHora(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || servicios.length === 0}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Agendar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
