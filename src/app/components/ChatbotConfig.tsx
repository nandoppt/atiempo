import { MessageSquare, Plus, Edit, Save, X } from 'lucide-react';
import { useState } from 'react';

export default function ChatbotConfig() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Bienvenida',
      trigger: 'inicio',
      message: '¡Hola! 👋 Bienvenido a nuestro sistema de agendamiento. ¿En qué puedo ayudarte hoy?',
      active: true,
    },
    {
      id: 2,
      name: 'Confirmar Cita',
      trigger: 'confirmacion',
      message: '✅ Tu cita ha sido confirmada para el {fecha} a las {hora}. Te enviaremos un recordatorio 24 horas antes.',
      active: true,
    },
    {
      id: 3,
      name: 'Recordatorio 24h',
      trigger: 'recordatorio_24h',
      message: '⏰ Recordatorio: Tienes una cita mañana a las {hora} para {servicio}. ¿Confirmas tu asistencia?',
      active: true,
    },
    {
      id: 4,
      name: 'Cancelación',
      trigger: 'cancelacion',
      message: 'Tu cita para el {fecha} a las {hora} ha sido cancelada. ¿Deseas agendar una nueva fecha?',
      active: true,
    },
    {
      id: 5,
      name: 'Reagendar',
      trigger: 'reagendar',
      message: '📅 ¿Qué fecha te gustaría para tu nueva cita? Por favor, indica día y hora preferida.',
      active: false,
    },
    {
      id: 6,
      name: 'Horarios Disponibles',
      trigger: 'horarios',
      message: 'Estos son los horarios disponibles para {fecha}:\n\n{lista_horarios}\n\n¿Cuál prefieres?',
      active: true,
    },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedMessage, setEditedMessage] = useState('');

  const startEditing = (template: typeof templates[0]) => {
    setEditingId(template.id);
    setEditedMessage(template.message);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedMessage('');
  };

  const saveTemplate = (id: number) => {
    setTemplates(templates.map(t =>
      t.id === id ? { ...t, message: editedMessage } : t
    ));
    setEditingId(null);
    setEditedMessage('');
  };

  const toggleActive = (id: number) => {
    setTemplates(templates.map(t =>
      t.id === id ? { ...t, active: !t.active } : t
    ));
  };

  const variables = [
    { name: '{fecha}', description: 'Fecha de la cita' },
    { name: '{hora}', description: 'Hora de la cita' },
    { name: '{servicio}', description: 'Tipo de servicio' },
    { name: '{cliente}', description: 'Nombre del cliente' },
    { name: '{ubicacion}', description: 'Lugar de la cita' },
    { name: '{lista_horarios}', description: 'Lista de horarios disponibles' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 rounded-lg p-3">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Configuración del Chatbot</h2>
              <p className="text-sm text-gray-500 mt-1">
                Personaliza los mensajes automáticos de WhatsApp
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium">
            <Plus className="w-4 h-4" />
            Nueva Plantilla
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-2 space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-mono">
                      {template.trigger}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={template.active}
                        onChange={() => toggleActive(template.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                    {editingId === template.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveTemplate(template.id)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(template)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === template.id ? (
                  <textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    placeholder="Escribe el mensaje de la plantilla..."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {template.message}
                    </p>
                  </div>
                )}
              </div>

              {!template.active && (
                <div className="bg-yellow-50 border-t border-yellow-100 px-6 py-3">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Esta plantilla está desactivada y no se enviará automáticamente
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Variables Guide */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Variables Disponibles</h3>
            <p className="text-sm text-gray-600 mb-4">
              Usa estas variables en tus mensajes para personalizar la información:
            </p>
            <div className="space-y-3">
              {variables.map((variable) => (
                <div key={variable.name} className="border-l-4 border-indigo-200 pl-3">
                  <code className="text-sm font-mono text-indigo-600 font-semibold">
                    {variable.name}
                  </code>
                  <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
            <h3 className="font-semibold text-indigo-900 mb-2">💡 Consejos</h3>
            <ul className="text-sm text-indigo-700 space-y-2">
              <li>• Usa emojis para hacer los mensajes más amigables</li>
              <li>• Mantén los mensajes concisos y claros</li>
              <li>• Incluye opciones de respuesta cuando sea posible</li>
              <li>• Personaliza con las variables disponibles</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-xl border border-green-100 p-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ Plantillas Activas</h3>
            <p className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.active).length}/{templates.length}
            </p>
            <p className="text-sm text-green-700 mt-1">
              plantillas en funcionamiento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
