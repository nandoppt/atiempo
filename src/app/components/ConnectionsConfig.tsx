import { MessageCircle, Calendar, Apple, Check, X, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';

export default function ConnectionsConfig() {
  const [connections, setConnections] = useState({
    whatsapp: {
      connected: false,
      phoneNumber: '',
      apiKey: '',
      businessName: '',
      lastSync: null,
    },
    googleCalendar: {
      connected: false,
      email: '',
      calendarId: '',
      lastSync: null,
    },
    appleCalendar: {
      connected: false,
      email: '',
      calendarId: '',
      lastSync: null,
    },
  });

  const [editingService, setEditingService] = useState<string | null>(null);

  const handleConnect = (service: string) => {
    alert(`Conectar ${service} - Esta funcionalidad estará disponible cuando conectes Supabase y agregues las API keys en la configuración de Make.`);
  };

  const handleDisconnect = (service: string) => {
    if (confirm(`¿Estás seguro de que deseas desconectar ${service}?`)) {
      setConnections({
        ...connections,
        [service]: {
          ...connections[service as keyof typeof connections],
          connected: false,
        },
      });
    }
  };

  const handleSync = (service: string) => {
    alert(`Sincronizando con ${service}... Esta funcionalidad requiere backend.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 rounded-lg p-3">
            <SettingsIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Configuración de Conexiones</h2>
            <p className="text-sm text-gray-500 mt-1">
              Conecta servicios externos para automatizar tu gestión de citas
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp Business */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-lg p-3">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">WhatsApp Business API</h3>
                <p className="text-sm text-gray-500">
                  Envía notificaciones y gestiona citas por WhatsApp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connections.whatsapp.connected ? (
                <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Conectado
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  <X className="w-4 h-4" />
                  Desconectado
                </span>
              )}
            </div>
          </div>

          {editingService === 'whatsapp' ? (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  placeholder="Mi Consultorio"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="+52 123 456 7890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                  <span className="ml-2 text-xs text-gray-500">
                    (Configurar en Make Settings)
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnect('WhatsApp Business')}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all font-medium"
                >
                  Conectar
                </button>
                <button
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {connections.whatsapp.connected ? (
                <>
                  <button
                    onClick={() => handleSync('WhatsApp')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar
                  </button>
                  <button
                    onClick={() => setEditingService('whatsapp')}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Configurar
                  </button>
                  <button
                    onClick={() => handleDisconnect('whatsapp')}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingService('whatsapp')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Conectar WhatsApp Business
                </button>
              )}
            </div>
          )}
        </div>

        {connections.whatsapp.connected && connections.whatsapp.lastSync && (
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
            <p className="text-sm text-gray-600">
              Última sincronización: {new Date(connections.whatsapp.lastSync).toLocaleString('es-ES')}
            </p>
          </div>
        )}
      </div>

      {/* Google Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Google Calendar</h3>
                <p className="text-sm text-gray-500">
                  Sincroniza automáticamente tus citas con Google Calendar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connections.googleCalendar.connected ? (
                <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Conectado
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  <X className="w-4 h-4" />
                  Desconectado
                </span>
              )}
            </div>
          </div>

          {editingService === 'googleCalendar' ? (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo de Google
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@gmail.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID del Calendario
                </label>
                <input
                  type="text"
                  placeholder="primary"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnect('Google Calendar')}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  Conectar con Google
                </button>
                <button
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {connections.googleCalendar.connected ? (
                <>
                  <button
                    onClick={() => handleSync('Google Calendar')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar
                  </button>
                  <button
                    onClick={() => setEditingService('googleCalendar')}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Configurar
                  </button>
                  <button
                    onClick={() => handleDisconnect('googleCalendar')}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingService('googleCalendar')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  Conectar Google Calendar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apple Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <Apple className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Apple Calendar (iCloud)</h3>
                <p className="text-sm text-gray-500">
                  Sincroniza tus citas con iCloud Calendar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connections.appleCalendar.connected ? (
                <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Conectado
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  <X className="w-4 h-4" />
                  Desconectado
                </span>
              )}
            </div>
          </div>

          {editingService === 'appleCalendar' ? (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apple ID (iCloud)
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@icloud.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de Aplicación
                </label>
                <input
                  type="password"
                  placeholder="••••-••••-••••-••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Genera una contraseña específica para apps en appleid.apple.com
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnect('Apple Calendar')}
                  className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-all font-medium"
                >
                  Conectar con iCloud
                </button>
                <button
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {connections.appleCalendar.connected ? (
                <>
                  <button
                    onClick={() => handleSync('Apple Calendar')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar
                  </button>
                  <button
                    onClick={() => setEditingService('appleCalendar')}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Configurar
                  </button>
                  <button
                    onClick={() => handleDisconnect('appleCalendar')}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingService('appleCalendar')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
                >
                  <Apple className="w-4 h-4" />
                  Conectar Apple Calendar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>
            • Para conectar estos servicios necesitas agregar tus credenciales API en la{' '}
            <strong>página de configuración de Make</strong>
          </li>
          <li>• Las conexiones requieren que configures Supabase como backend</li>
          <li>• Los datos se sincronizarán automáticamente cada vez que se cree, edite o cancele una cita</li>
          <li>• Puedes desconectar cualquier servicio en cualquier momento sin perder tus datos locales</li>
        </ul>
      </div>
    </div>
  );
}
