import { Calendar, Clock, CheckCircle, Plus, Bell } from 'lucide-react';

export default function ClientDashboard() {
  const upcomingAppointments = [
    {
      id: 1,
      date: '2026-04-12',
      time: '10:00 AM',
      service: 'Consulta General',
      location: 'Consultorio Principal',
      status: 'confirmed',
    },
    {
      id: 2,
      date: '2026-04-18',
      time: '3:00 PM',
      service: 'Seguimiento',
      location: 'Consultorio Principal',
      status: 'pending',
    },
  ];

  const pastAppointments = [
    {
      id: 3,
      date: '2026-04-05',
      time: '11:30 AM',
      service: 'Primera Consulta',
      status: 'completed',
    },
    {
      id: 4,
      date: '2026-03-28',
      time: '2:00 PM',
      service: 'Revisión',
      status: 'completed',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">¡Hola, Juan!</h2>
        <p className="text-indigo-100 mb-6">
          Aquí puedes gestionar tus citas de manera fácil y rápida
        </p>
        <button className="bg-white text-indigo-600 font-medium px-6 py-3 rounded-lg hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-md">
          <Plus className="w-5 h-5" />
          Agendar Nueva Cita
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Próximas Citas</p>
              <h3 className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completadas</p>
              <h3 className="text-2xl font-bold text-gray-900">{pastAppointments.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-lg p-3">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Notificaciones</p>
              <h3 className="text-2xl font-bold text-gray-900">2</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Próximas Citas</h3>
        </div>
        <div className="p-6 space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-100 rounded-lg p-3">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{appointment.service}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(appointment.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appointment.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{appointment.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes citas programadas</p>
              <button className="mt-4 text-indigo-600 font-medium hover:text-indigo-700">
                Agendar una cita
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Past Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Historial de Citas</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {pastAppointments.map((appointment) => (
            <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">{appointment.service}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(appointment.date).toLocaleDateString('es-ES')} - {appointment.time}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Completada</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
