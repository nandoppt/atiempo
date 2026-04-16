import { useState } from 'react'
import { X, Loader2, CalendarPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useServicios } from '../../lib/hooks'
import { useAuth } from '../../lib/AuthContext'

interface NuevaCitaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Pre-fill cliente_id when opened from admin selecting a client */
  clienteId?: string
}

export default function NuevaCitaModal({ isOpen, onClose, onSuccess, clienteId }: NuevaCitaModalProps) {
  const { user, role } = useAuth()
  const { servicios, loading: serviciosLoading } = useServicios(true) // only active

  const [servicioId, setServicioId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const resolvedClienteId = clienteId ?? user?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!resolvedClienteId) {
      setError('No se pudo identificar el cliente.')
      return
    }
    if (!servicioId) {
      setError('Selecciona un servicio.')
      return
    }
    if (!fecha || !hora) {
      setError('Selecciona fecha y hora.')
      return
    }

    setLoading(true)

    const fechaHoraISO = new Date(`${fecha}T${hora}:00`).toISOString()

    const { error: dbError } = await supabase.from('citas').insert({
      cliente_id: resolvedClienteId,
      servicio_id: servicioId,
      fecha_hora_inicio: fechaHoraISO,
      estado: role === 'admin' ? 'confirmada' : 'pendiente',
      fecha_creacion: new Date().toISOString(),
    })

    setLoading(false)

    if (dbError) {
      setError(dbError.message)
    } else {
      setServicioId('')
      setFecha('')
      setHora('')
      onSuccess()
      onClose()
    }
  }

  // Min date = today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 rounded-lg p-2">
              <CalendarPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Nueva Cita</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
            {serviciosLoading ? (
              <div className="w-full h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <select
                value={servicioId}
                onChange={e => setServicioId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                required
              >
                <option value="">Selecciona un servicio…</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}{s.duracion_minutos ? ` (${s.duracion_minutos} min)` : ''}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
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
