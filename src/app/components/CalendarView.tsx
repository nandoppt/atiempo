import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Plus } from 'lucide-react';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 10)); // April 10, 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 10));

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Mock appointments data
  const appointments: Record<string, Array<{ time: string; client: string; service: string; status: 'busy' | 'available' }>> = {
    '2026-04-10': [
      { time: '09:00', client: 'María González', service: 'Consulta', status: 'busy' },
      { time: '10:00', client: '', service: '', status: 'available' },
      { time: '11:00', client: 'Carlos Ruiz', service: 'Seguimiento', status: 'busy' },
      { time: '12:00', client: '', service: '', status: 'available' },
      { time: '14:00', client: 'Ana Martínez', service: 'Primera Cita', status: 'busy' },
      { time: '15:00', client: '', service: '', status: 'available' },
      { time: '16:00', client: 'Luis Rodríguez', service: 'Consulta', status: 'busy' },
      { time: '17:00', client: '', service: '', status: 'available' },
    ],
    '2026-04-11': [
      { time: '09:00', client: '', service: '', status: 'available' },
      { time: '10:00', client: 'Sofia López', service: 'Revisión', status: 'busy' },
      { time: '11:00', client: '', service: '', status: 'available' },
      { time: '12:00', client: 'Pedro Sánchez', service: 'Consulta', status: 'busy' },
      { time: '14:00', client: '', service: '', status: 'available' },
      { time: '15:00', client: '', service: '', status: 'available' },
      { time: '16:00', client: '', service: '', status: 'available' },
      { time: '17:00', client: '', service: '', status: 'available' },
    ],
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date(2026, 3, 10); // Current date in demo
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateKey = formatDateKey(date);
    return appointments[dateKey] || [];
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);
  const busySlots = selectedDateAppointments.filter(apt => apt.status === 'busy').length;
  const availableSlots = selectedDateAppointments.filter(apt => apt.status === 'available').length;

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
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateAppointments = getAppointmentsForDate(date);
              const hasBusySlots = dateAppointments.some(apt => apt.status === 'busy');

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-2 rounded-lg transition-all ${
                    isSelected(date)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isToday(date)
                      ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium">{date.getDate()}</div>
                  {hasBusySlots && !isSelected(date) && (
                    <div className="flex justify-center mt-1">
                      <div className="w-1 h-1 rounded-full bg-indigo-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
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
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-sm text-gray-600">Día con citas</span>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-6">
        {/* Date Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{availableSlots}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Ocupados</p>
              <p className="text-2xl font-bold text-red-600">{busySlots}</p>
            </div>
          </div>
        </div>

        {/* Time Slots List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-900">Horarios</h4>
          </div>
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {selectedDateAppointments.length > 0 ? (
              selectedDateAppointments.map((slot, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    slot.status === 'busy'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{slot.time}</span>
                    </div>
                    {slot.status === 'available' && (
                      <Plus className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  {slot.status === 'busy' ? (
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{slot.client}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{slot.service}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-green-600">Disponible para agendar</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay horarios configurados para este día</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
