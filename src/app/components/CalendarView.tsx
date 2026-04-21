import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { useCitasPorFecha, useCitasPorMes } from '../../lib/hooks'

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const selectedDateKey = selectedDate.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  const { citas, loading } = useCitasPorFecha(selectedDateKey)
  const citasPorDia = useCitasPorMes(currentDate.getFullYear(), currentDate.getMonth())

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const daysOfWeek = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  const days = getDaysInMonth(currentDate)

  const isToday = (date: Date | null) => {
    if (!date) return false
    return date.toDateString() === new Date().toDateString()
  }

  const isSelected = (date: Date | null) => {
    if (!date) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const getDayKey = (date: Date) => date.toLocaleDateString('en-CA') // YYYY-MM-DD local

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map(d => (
              <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">{d}</div>
            ))}
            {days.map((date, index) => {
              if (date === null) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }
              const dayKey = getDayKey(date)
              const citaCount = citasPorDia[dayKey] ?? 0
              const hasCitas = citaCount > 0
              const selected = isSelected(date)
              const today = isToday(date)

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-1 rounded-lg transition-all text-sm font-medium flex flex-col items-center justify-center gap-0.5 ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : today
                      ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{date.getDate()}</span>
                  {hasCitas && (
                    <span className={`block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      selected ? 'bg-white/70' : 'bg-indigo-400'
                    }`} />
                  )}
                  {!hasCitas && <span className="block w-1.5 h-1.5 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-sm text-gray-600">Con citas</span>
          </div>
        </div>
      </div>

      {/* Day detail */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Citas</p>
              <p className="text-2xl font-bold text-red-600">{loading ? '—' : citas.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '—' : citas.filter(c => c.estado === 'confirmada').length}
              </p>
            </div>
          </div>

          {/* Extra stats */}
          {!loading && citas.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {citas.filter(c => c.estado === 'pendiente').length}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {citas.filter(c => c.estado === 'completada').length}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-900">Citas del día</h4>
          </div>
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-4">Cargando...</p>
            ) : citas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay citas para este día</p>
              </div>
            ) : citas.map((cita) => {
              const hora = cita.fecha_hora_inicio
                ? new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                : '—'
              const nombreCliente = cita.clientes?.nombre ?? cita.clientes?.email ?? 'Cliente'
              const servicio = cita.servicios?.nombre ?? 'Sin servicio'

              const estadoColors: Record<string, string> = {
                confirmada: 'bg-green-50 border-green-200',
                pendiente: 'bg-yellow-50 border-yellow-200',
                cancelada: 'bg-red-50 border-red-200',
                completada: 'bg-blue-50 border-blue-200',
              }
              const badgeColors: Record<string, string> = {
                confirmada: 'bg-green-100 text-green-700',
                pendiente: 'bg-yellow-100 text-yellow-700',
                cancelada: 'bg-red-100 text-red-700',
                completada: 'bg-blue-100 text-blue-700',
              }

              const estado = cita.estado ?? 'pendiente'
              const cardColor = estadoColors[estado] ?? estadoColors['pendiente']
              const badgeColor = badgeColors[estado] ?? badgeColors['pendiente']

              return (
                <div key={cita.id} className={`p-4 rounded-lg border-2 ${cardColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-sm text-gray-800">{hora}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${badgeColor}`}>
                      {estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{nombreCliente}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">{servicio}</p>
                  {cita.servicios?.duracion_minutos && (
                    <p className="text-xs text-gray-400 mt-0.5 ml-6">{cita.servicios.duracion_minutos} min</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
