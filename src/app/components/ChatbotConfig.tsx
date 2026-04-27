import { MessageSquare, Plus, Edit, Save, X, Trash2, AlertTriangle, Loader2, RefreshCw, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { usePlantillasChatbot } from '../../lib/hooks'
import { PlantillaChatbot } from '../../lib/supabase'

const VARIABLES = [
  { name: '{fecha}', description: 'Fecha de la cita' },
  { name: '{hora}', description: 'Hora de la cita' },
  { name: '{servicio}', description: 'Tipo de servicio' },
  { name: '{cliente}', description: 'Nombre del cliente' },
  { name: '{ubicacion}', description: 'Lugar de la cita' },
  { name: '{lista_horarios}', description: 'Lista de horarios disponibles' },
]

export default function ChatbotConfig() {
  const { plantillas, loading, useLocalFallback, updatePlantilla, createPlantilla, deletePlantilla, refetch } = usePlantillasChatbot()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<Partial<PlantillaChatbot>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newPlantilla, setNewPlantilla] = useState({ nombre: '', trigger: '', mensaje: '', activo: true })
  const [savingNew, setSavingNew] = useState(false)

  const startEditing = (p: PlantillaChatbot) => {
    setEditingId(p.id)
    setEditedData({ nombre: p.nombre, trigger: p.trigger, mensaje: p.mensaje, activo: p.activo })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditedData({})
  }

  const handleSave = async (id: string) => {
    setSavingId(id)
    const { error } = await updatePlantilla(id, editedData)
    setSavingId(null)
    if (error) toast.error('Error al guardar la plantilla')
    else { toast.success('Plantilla guardada ✓'); setEditingId(null); setEditedData({}) }
  }

  const handleToggle = async (p: PlantillaChatbot) => {
    const { error } = await updatePlantilla(p.id, { activo: !p.activo })
    if (error) toast.error('Error al actualizar')
    else toast.success(p.activo ? 'Plantilla desactivada' : 'Plantilla activada')
  }

  const handleDelete = async (id: string) => {
    const { error } = await deletePlantilla(id)
    setConfirmDeleteId(null)
    if (error) toast.error('Error al eliminar')
    else toast.success('Plantilla eliminada')
  }

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlantilla.nombre.trim() || !newPlantilla.trigger.trim() || !newPlantilla.mensaje.trim()) {
      toast.error('Completa todos los campos')
      return
    }
    setSavingNew(true)
    const { error } = await createPlantilla(newPlantilla)
    setSavingNew(false)
    if (error) toast.error('Error al crear la plantilla')
    else {
      toast.success('Plantilla creada ✓')
      setShowNewForm(false)
      setNewPlantilla({ nombre: '', trigger: '', mensaje: '', activo: true })
    }
  }

  const insertVariable = (variable: string, field: 'mensaje' | 'new') => {
    if (field === 'new') {
      setNewPlantilla(p => ({ ...p, mensaje: (p.mensaje ?? '') + variable }))
    } else if (editingId) {
      setEditedData(p => ({ ...p, mensaje: ((p.mensaje ?? '') + variable) }))
    }
  }

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
          <div className="flex items-center gap-2">
            {useLocalFallback && (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                <WifiOff className="w-3 h-3" />
                Modo local
              </span>
            )}
            <button
              onClick={refetch}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Recargar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Plantilla
            </button>
          </div>
        </div>
      </div>

      {useLocalFallback && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Modo sin conexión a DB:</strong> Los cambios se guardan en memoria de esta sesión.
          Para persistencia permanente, crea la tabla <code className="bg-amber-100 px-1 rounded">plantillas_chatbot</code> en Supabase.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates */}
        <div className="lg:col-span-2 space-y-4">
          {/* New template form */}
          {showNewForm && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
              <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva Plantilla
              </h3>
              <form onSubmit={handleCreateNew} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      value={newPlantilla.nombre}
                      onChange={e => setNewPlantilla(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Ej: Confirmación"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Trigger</label>
                    <input
                      value={newPlantilla.trigger}
                      onChange={e => setNewPlantilla(p => ({ ...p, trigger: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                      placeholder="Ej: confirmacion"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mensaje</label>
                  <textarea
                    value={newPlantilla.mensaje}
                    onChange={e => setNewPlantilla(p => ({ ...p, mensaje: e.target.value }))}
                    rows={3}
                    placeholder="Escribe el mensaje… usa las variables de la derecha"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {VARIABLES.map(v => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => insertVariable(v.name, 'new')}
                        className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono hover:bg-indigo-200 transition-colors"
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingNew}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-60"
                  >
                    {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewForm(false); setNewPlantilla({ nombre: '', trigger: '', mensaje: '', activo: true }) }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Cargando plantillas...</p>
            </div>
          ) : plantillas.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                template.activo ? 'border-gray-100' : 'border-gray-200 opacity-75'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {editingId === template.id ? (
                      <input
                        value={editedData.nombre ?? template.nombre}
                        onChange={e => setEditedData(d => ({ ...d, nombre: e.target.value }))}
                        className="font-semibold text-gray-900 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <h3 className="font-semibold text-gray-900">{template.nombre}</h3>
                    )}
                    {editingId === template.id ? (
                      <input
                        value={editedData.trigger ?? template.trigger}
                        onChange={e => setEditedData(d => ({ ...d, trigger: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-mono border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-mono">
                        {template.trigger}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(template)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        template.activo ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        template.activo ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>

                    {editingId === template.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSave(template.id)}
                          disabled={savingId === template.id}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all disabled:opacity-60"
                        >
                          {savingId === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditing(template)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === template.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Eliminar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(template.id)}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {editingId === template.id ? (
                  <div>
                    <textarea
                      value={editedData.mensaje ?? template.mensaje}
                      onChange={e => setEditedData(d => ({ ...d, mensaje: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm outline-none"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-gray-500 mr-1">Insertar:</span>
                      {VARIABLES.map(v => (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => insertVariable(v.name, 'mensaje')}
                          className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono hover:bg-indigo-200 transition-colors"
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{template.mensaje}</p>
                  </div>
                )}
              </div>

              {!template.activo && (
                <div className="bg-yellow-50 border-t border-yellow-100 px-6 py-3">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Esta plantilla está desactivada y no se enviará automáticamente
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Variables Disponibles</h3>
            <p className="text-sm text-gray-600 mb-4">
              Haz clic para copiar o usa los botones de inserción al editar:
            </p>
            <div className="space-y-3">
              {VARIABLES.map((v) => (
                <button
                  key={v.name}
                  onClick={() => {
                    navigator.clipboard.writeText(v.name)
                    toast.success(`${v.name} copiado`)
                  }}
                  className="w-full text-left border-l-4 border-indigo-200 pl-3 hover:border-indigo-400 transition-colors group"
                >
                  <code className="text-sm font-mono text-indigo-600 font-semibold group-hover:text-indigo-700">
                    {v.name}
                  </code>
                  <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
            <h3 className="font-semibold text-indigo-900 mb-2">💡 Consejos</h3>
            <ul className="text-sm text-indigo-700 space-y-2">
              <li>• Usa emojis para mensajes más amigables</li>
              <li>• Mantén los mensajes concisos y claros</li>
              <li>• El trigger identifica cuándo se envía</li>
              <li>• Puedes desactivar sin borrar</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-xl border border-green-100 p-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ Estado</h3>
            <p className="text-2xl font-bold text-green-600">
              {plantillas.filter(t => t.activo).length}/{plantillas.length}
            </p>
            <p className="text-sm text-green-700 mt-1">plantillas activas</p>
            {useLocalFallback && (
              <p className="text-xs text-amber-600 mt-2">⚠️ Datos en memoria local</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
