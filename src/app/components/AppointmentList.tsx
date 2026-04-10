import { Calendar, Clock, Edit, Trash2, CheckCircle, X, Filter } from 'lucide-react';
import { useState } from 'react';

interface AppointmentListProps {
  userType: 'admin' | 'client';
}

export default function AppointmentList({ userType }: AppointmentListProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  const allAppointments = [
    {
      id: 1,
      client: 'María González',
      date: '2026-04-12',
      time: '10:00 AM',
      service: 'Consulta General',
      location: 'Consultorio Principal',
      status: 'confirmed',
      notes: 'Primera consulta del mes',
    },
    {
      id: 2,
      client: 'Carlos Ruiz',
      date: '2026-04-12',
      time: '11:30 AM',
      service: 'Seguimiento',
      location: 'Consultorio Principal',
      status: 'confirmed',
      notes: '',
    },
    {
      id: 3,
      client: 'Ana Martínez',
      date: '2026-04-13',
      time: '2:00 PM',
      service: 'Primera Cita',
      location: 'Consultorio Anexo',
      status: 'pending',
      notes: 'Pendiente de confirmación',
    },
    {
      id: 4,
      client: 'Luis Rodríguez',
      date: '2026-04-15',
      time: '3:30 PM',
      service: 'Consulta General',
      location: 'Consultorio Principal',
      status: 'confirmed',
      notes: '',
    },
    {
      id: 5,
      client: 'Sofia López',
      date: '2026-04-16',
      time: '9:00 AM',
      service: 'Revisión',
      location: 'Consultorio Principal',
      status: 'pending',
      notes: '',
    },
    {
      id: 6,
      client: 'Pedro Sánchez',
      date: '2026-04-08',
      time: '4:00 PM',
      service: 'Consulta',
      location: 'Consultorio Principal',
      status: 'cancelled',
      notes: 'Cancelada por el paciente',
    },
  ];

  const filteredAppointments = allAppointments.filter(
    apt => filterStatus === 'all' || apt.status === filterStatus
  );

  const handleEdit = (id: number) => {
    alert(`Editar cita #${id} - Funcionalidad disponible con backend conectado`);
  };

  const handleCancel = (id: number) => {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      alert(`Cita #${id} cancelada - Funcionalidad disponible con backend conectado`);
    }
  };

  const handleConfirm = (id: number) => {
    alert(`Cita #${id} confirmada - Funcionalidad disponible con backend conectado`);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmada' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {userType === 'admin' ? 'Todas las Citas' : 'Mis Citas'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Todas</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Appointment Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {userType === 'admin' && (
                        <h3 className="font-semibold text-gray-900 mb-1">{appointment.client}</h3>
                      )}
                      <h4 className="text-lg font-medium text-indigo-600">{appointment.service}</h4>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(appointment.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{appointment.time}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">{appointment.location}</p>

                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mt-3 italic bg-gray-50 rounded-lg p-3">
                      {appointment.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  {appointment.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => handleEdit(appointment.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-medium text-sm flex-1 lg:flex-none"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>

                      {userType === 'admin' && appointment.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(appointment.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all font-medium text-sm flex-1 lg:flex-none"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                      )}

                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm flex-1 lg:flex-none"
                      >
                        {userType === 'client' ? (
                          <>
                            <X className="w-4 h-4" />
                            Cancelar
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {appointment.status === 'cancelled' && (
                    <div className="text-sm text-gray-500 italic text-center lg:text-right">
                      Cita cancelada
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay citas {filterStatus !== 'all' && `${filterStatus === 'confirmed' ? 'confirmadas' : filterStatus === 'pending' ? 'pendientes' : 'canceladas'}`}
            </h3>
            <p className="text-gray-500">
              {filterStatus !== 'all' ? 'Prueba con otro filtro' : 'No tienes citas registradas'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
