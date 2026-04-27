import { useState, useEffect } from 'react'
import { X, Loader2, CalendarPlus, Clock, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useServicios, useHorariosDisponibles } from '../../lib/hooks'
import { useAuth } from '../../lib/AuthContext'

interface NuevaCitaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clienteId?: string
  // Pre-fill date from calendar click
  fechaInicial?: string
}

export default function NuevaCitaModal({ isOpen, onClose, onSuccess, clienteId, fechaInicial }: NuevaCitaModalProps) {
  const { user, role } = useAuth()
  const { servicios, loading: serviciosLoading } = useServicios(true)

  const [servicioId, setServicioId] = useState('')
  const [fecha, setFecha] = useState(fechaInicial ?? '')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [modoHora, setModoHora] = useState<'slots' | 'manual'>('slots')

  // Get duration of selected service
  const servicioSeleccionado = servicios.find(s => s.id === servicioId)
  const duracion = servicioSeleccionado?.duracion_minutos ?? 60

  const { horariosDisponibles, loading: loadingSlots } = useHorariosDisponibles(
    fecha,
    duracion
  )

  // Reset hora when date or service changes
  useEffect(() => {
    setHoraSeleccionada('')
  }, [fecha, servicioId])

  // Pre-fill date if provided
  useEffect(() => {
    if (fechaInicial) setFecha(fechaInicial)
  }, [fechaInicial])

  if (!isOpen) return null

  const resolvedClienteId = clienteId ?? user?.id

  const handleClose = () => {
    setServicioId('')
    setFecha(fechaInicial ?? '')
    setHoraSeleccionada('')
    setNotas('')
    setModoHora('slots')
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
    if (!fecha || !horaSeleccionada) {
      toast.error('Selecciona fecha y hora')
      return
    }

    const selectedDate = new Date(`${fecha}T${horaSeleccionada}:00`)
    if (selectedDate <= new Date()) {
      toast.error('No puedes agendar una cita en el pasado')
      return
    }

    // Validate within business hours (8am - 6pm)
    const hour = selectedDate.getHours()
    if (hour < 8 || hour >= 18) {
      toast.error('El horario de atención es de 8:00 a 18:00')
      return
    }

    setLoading(true)

    // Double-check for conflicts (for manual mode)
    if (modoHora === 'manual') {
      const { startOfDay, endOfDay } = getLocalDayRange(fecha)
      const { data: conflictos } = await supabase
        .from('citas')
        .select('fecha_hora_inicio, servicios(duracion_minutos)')
        .gte('fecha_hora_inicio', startOfDay)
        .lte('fecha_hora_inicio', endOfDay)
        .neq('estado', 'cancelada')

      const slotEnd = new Date(selectedDate.getTime() + duracion * 60000)
      const hasConflict = (conflictos ?? []).some((c: any) => {
        if (!c.fecha_hora_inicio) return false
        const existingStart = new Date(c.fecha_hora_inicio)
        const existingDuration = c.servicios?.duracion_minutos ?? 60
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000)
        return selectedDate < existingEnd && slotEnd > existingStart
      })

      if (hasConflict) {
        setLoading(false)
        toast.error('Ese horario ya está ocupado. Elige otro.')
        return
      }
    }

    const { error } = await supabase.from('citas').insert({
      cliente_id: resolvedClienteId,
      servicio_id: servicioId,
      fecha_hora_inicio: selectedDate.toISOString(),
      estado: role === 'admin' ? 'confirmada' : 'pendiente',
      fecha_creacion: new Date().toISOString(),
      notas: notas.trim() || null,
    })

    setLoading(false)

    if (error) {
      toast.error(`Error al agendar: ${error.message}`)
    } else {
      const nombre = servicioSeleccionado?.nombre ?? 'Cita'
      if (role === 'admin') {
        toast.success(`${nombre} agendada y confirmada para el ${selectedDate.toLocaleDateString('es-ES')} a las ${horaSeleccionada}`)
      } else {
        toast.success('Cita enviada. Espera la confirmación del administrador.')
      }
      onSuccess()
      handleClose()
    }
  }

  const today = new Date().toLocaleDateString('en-CA')

  const isWeekend = (dateStr: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr + 'T12:00:00')
    return d.getDay() === 0 || d.getDay() === 6
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between p-6 pb-4 border-b border-gray-100">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio <span className="text-red-500">*</span>
            </label>
            {serviciosLoading ? (
              <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
            ) : servicios.length === 0 ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                No hay servicios disponibles. Contacta al administrador.
              </div>
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
                    {s.nombre}
                    {s.duracion_minutos ? ` · ${s.duracion_minutos} min` : ''}
                    {s.precio ? ` · $${s.precio}` : ''}
                  </option>
                ))}
              </select>
            )}
            {servicioSeleccionado && (
              <p className="text-xs text-gray-400 mt-1 ml-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duración: {servicioSeleccionado.duracion_minutos ?? 60} minutos
              </p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fecha}
              min={today}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              required
            />
            {isWeekend(fecha) && (
              <p className="text-xs text-amber-600 mt-1 ml-1">
                ⚠️ Este día es fin de semana. Verifica que haya atención.
              </p>
            )}
          </div>

          {/* Hora */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Hora <span className="text-red-500">*</span>
              </label>
              {fecha && servicioId && (
                <button
                  type="button"
                  onClick={() => { setModoHora(m => m === 'slots' ? 'manual' : 'slots'); setHoraSeleccionada('') }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                >
                  {modoHora === 'slots' ? 'Ingresar hora manualmente' : 'Ver horarios disponibles'}
                </button>
              )}
            </div>

            {!fecha || !servicioId ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 text-center">
                Selecciona servicio y fecha primero
              </div>
            ) : modoHora === 'slots' ? (
              loadingSlots ? (
                <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-sm text-gray-500">Buscando horarios disponibles...</span>
                </div>
              ) : horariosDisponibles.length === 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                  😔 No hay horarios disponibles para este día.
                  <br />
                  <button
                    type="button"
                    onClick={() => { setModoHora('manual'); setHoraSeleccionada('') }}
                    className="mt-1 text-xs underline"
                  >
                    Intentar con otra hora manualmente
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                    {horariosDisponibles.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setHoraSeleccionada(slot)}
                        className={`px-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          horaSeleccionada === slot
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {horariosDisponibles.length} horario{horariosDisponibles.length !== 1 ? 's' : ''} disponible{horariosDisponibles.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )
            ) : (
              <div>
                <input
                  type="time"
                  value={horaSeleccionada}
                  min="08:00"
                  max="17:30"
                  onChange={e => setHoraSeleccionada(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">Horario de atención: 08:00 – 18:00</p>
              </div>
            )}
          </div>

          {/* Resumen */}
          {servicioSeleccionado && fecha && horaSeleccionada && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-sm font-medium text-indigo-800 mb-1">📋 Resumen de tu cita</p>
              <p className="text-sm text-indigo-700">
                <span className="font-medium">{servicioSeleccionado.nombre}</span>
                {' · '}
                {new Date(`${fecha}T${horaSeleccionada}`).toLocaleDateString('es-ES', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
                {' a las '}
                <span className="font-medium">{horaSeleccionada}</span>
              </p>
              {servicioSeleccionado.duracion_minutos && (
                <p className="text-xs text-indigo-500 mt-1">
                  Termina aproximadamente a las{' '}
                  {(() => {
                    const end = new Date(`${fecha}T${horaSeleccionada}`)
                    end.setMinutes(end.getMinutes() + servicioSeleccionado.duracion_minutos!)
                    return end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  })()}
                </p>
              )}
            </div>
          )}

          {/* Notas opcionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Ej: Primera vez, alergia a X, preferencia por X…"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{notas.length}/300</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || servicios.length === 0 || !horaSeleccionada}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {role === 'admin' ? 'Agendar y confirmar' : 'Solicitar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Helper (duplicated locally to avoid circular import)
function getLocalDayRange(fecha: string) {
  const offset = new Date().getTimezoneOffset()
  const sign = offset <= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const hh = String(Math.floor(absOffset / 60)).padStart(2, '0')
  const mm = String(absOffset % 60).padStart(2, '0')
  const tz = `${sign}${hh}:${mm}`
  return { startOfDay: `${fecha}T00:00:00${tz}`, endOfDay: `${fecha}T23:59:59${tz}` }
}
