import { Bell, X, Check, Calendar, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { useState } from 'react';

interface Notification {
  id: number;
  type: 'appointment' | 'reminder' | 'cancellation' | 'confirmation';
  title: string;
  message: string;
  time: string;
  read: boolean;
  urgent: boolean;
}

interface NotificationPanelProps {
  userType: 'admin' | 'client';
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ userType, isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'appointment',
      title: 'Nueva cita agendada',
      message: 'María González agendó una cita para mañana a las 10:00 AM',
      time: 'Hace 5 min',
      read: false,
      urgent: true,
    },
    {
      id: 2,
      type: 'reminder',
      title: 'Recordatorio de cita',
      message: 'Tienes una cita en 1 hora con Carlos Ruiz',
      time: 'Hace 15 min',
      read: false,
      urgent: true,
    },
    {
      id: 3,
      type: 'confirmation',
      title: 'Cita confirmada',
      message: 'Ana Martínez confirmó su cita del viernes',
      time: 'Hace 30 min',
      read: true,
      urgent: false,
    },
    {
      id: 4,
      type: 'cancellation',
      title: 'Cita cancelada',
      message: 'Pedro Sánchez canceló su cita del jueves',
      time: 'Hace 1 hora',
      read: true,
      urgent: false,
    },
    {
      id: 5,
      type: 'reminder',
      title: 'Envío de recordatorios',
      message: 'Se enviaron 5 recordatorios automáticos por WhatsApp',
      time: 'Hace 2 horas',
      read: true,
      urgent: false,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5" />;
      case 'reminder':
        return <Clock className="w-5 h-5" />;
      case 'confirmation':
        return <Check className="w-5 h-5" />;
      case 'cancellation':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-600';
      case 'reminder':
        return 'bg-orange-100 text-orange-600';
      case 'confirmation':
        return 'bg-green-100 text-green-600';
      case 'cancellation':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500">{unreadCount} sin leer</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`${getIconColor(notification.type)} rounded-lg p-2 h-fit`}>
                      {getIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {notification.title}
                          {notification.urgent && (
                            <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </h3>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{notification.time}</span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Marcar como leída
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes notificaciones
              </h3>
              <p className="text-sm text-gray-500">
                Te notificaremos cuando haya novedades
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Las notificaciones se actualizan en tiempo real cuando el backend esté conectado
          </p>
        </div>
      </div>
    </>
  );
}
