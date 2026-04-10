import { Calendar, Users, CheckCircle, Clock, TrendingUp, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      label: 'Citas Hoy',
      value: '12',
      change: '+3',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Clientes',
      value: '248',
      change: '+12',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: 'Completadas',
      value: '187',
      change: '+8',
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
    {
      label: 'Pendientes',
      value: '23',
      change: '-2',
      icon: Clock,
      color: 'bg-orange-500',
    },
  ];

  const upcomingAppointments = [
    { id: 1, client: 'María González', time: '10:00 AM', service: 'Consulta General', status: 'confirmed' },
    { id: 2, client: 'Carlos Ruiz', time: '11:30 AM', service: 'Seguimiento', status: 'confirmed' },
    { id: 3, client: 'Ana Martínez', time: '2:00 PM', service: 'Primera Cita', status: 'pending' },
    { id: 4, client: 'Luis Rodríguez', time: '3:30 PM', service: 'Consulta General', status: 'confirmed' },
    { id: 5, client: 'Sofia López', time: '4:45 PM', service: 'Revisión', status: 'pending' },
  ];

  const recentActivity = [
    { id: 1, action: 'Nueva cita agendada', client: 'María González', time: 'Hace 5 min' },
    { id: 2, action: 'Cita cancelada', client: 'Pedro Sánchez', time: 'Hace 15 min' },
    { id: 3, action: 'Cita confirmada', client: 'Carlos Ruiz', time: 'Hace 30 min' },
    { id: 4, action: 'Recordatorio enviado', client: 'Ana Martínez', time: 'Hace 1 hora' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                  <p className={`text-sm mt-2 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} vs ayer
                  </p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Próximas Citas</h3>
              <span className="text-sm text-indigo-600 font-medium cursor-pointer hover:text-indigo-700">
                Ver todas
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {appointment.client.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{appointment.client}</h4>
                      <p className="text-sm text-gray-500">{appointment.service}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{appointment.time}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
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
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500 truncate">{activity.client}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">¿Todo listo para hoy?</h3>
            <p className="text-indigo-100">
              Tienes 12 citas programadas. Revisa tu calendario para más detalles.
            </p>
          </div>
          <TrendingUp className="w-16 h-16 opacity-50" />
        </div>
      </div>
    </div>
  );
}
