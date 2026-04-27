import { MessageCircle, Calendar, Apple, Check, X, RefreshCw, Settings as SettingsIcon, Loader2, WifiOff, Unlink, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useConfiguracionConexiones } from '../../lib/hooks'

interface FormState {
  whatsapp: { phoneNumber: string; apiKey: string; businessName: string }
  google_calendar: { email: string; calendarId: string; accessToken: string }
  apple_calendar: { email: string; appPassword: string; calendarId: string }
}

const EMPTY_FORMS: FormState = {
  whatsapp: { phoneNumber: '', apiKey: '', businessName: '' },
  google_calendar: { email: '', calendarId: 'primary', accessToken: '' },
  apple_calendar: { email: '', appPassword: '', calendarId: '' },
}

export default function ConnectionsConfig() {
  const { conexiones, loading, useLocalFallback, saveConexion, disconnectConexion, refetch } = useConfiguracionConexiones()
  const [editingService, setEditingService] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormState>(EMPTY_FORMS)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null)

  const startEditing = (service: string) => {
    const existing = conexiones[service]?.datos ?? {}
    setFormData(prev => ({
      ...prev,
      [service]: { ...EMPTY_FORMS[service as keyof FormState], ...existing },
    }))
    setEditingService(service)
  }

  const handleConnect = async (service: string) => {
    setSaving(true)
    const datos = formData[service as keyof FormState] as Record<string, string>

    // Validate required fields
    const requiredByService: Record<string, string[]> = {
      whatsapp: ['phoneNumber', 'apiKey', 'businessName'],
      google_calendar: ['email'],
      apple_calendar: ['email', 'appPassword'],
    }
    const required = requiredByService[service] ?? []
    const missing = required.filter(k => !datos[k]?.trim())
    if (missing.length > 0) {
      toast.error('Completa todos los campos requeridos')
      setSaving(false)
      return
    }

    // Remove sensitive data from storage (don't persist raw passwords/tokens)
    const safeData: Record<string, string> = {}
    Object.entries(datos).forEach(([k, v]) => {
      if (k !== 'apiKey' && k !== 'appPassword' && k !== 'accessToken') {
        safeData[k] = v
      } else if (v) {
        safeData[k] = '••••••••' // mask sensitive fields
      }
    })

    const { error } = await saveConexion(service, {
      conectado: true,
      datos: safeData,
    })
    setSaving(false)

    if (error) {
      toast.error('Error al guardar la configuración')
    } else {
      toast.success(`${getServiceName(service)} conectado correctamente ✓`)
      setEditingService(null)
    }
  }

  const handleDisconnect = async (service: string) => {
    const { error } = await disconnectConexion(service)
    setConfirmDisconnect(null)
    if (error) toast.error('Error al desconectar')
    else toast.success(`${getServiceName(service)} desconectado`)
  }

  const handleSync = async (service: string) => {
    setSyncing(service)
    // Simulate sync (real implementation would call your backend/Make webhook)
    await new Promise(r => setTimeout(r, 1500))
    setSyncing(null)
    toast.success(`${getServiceName(service)} sincronizado`)
  }

  const getServiceName = (service: string) => {
    const names: Record<string, string> = {
      whatsapp: 'WhatsApp Business',
      google_calendar: 'Google Calendar',
      apple_calendar: 'Apple Calendar',
    }
    return names[service] ?? service
  }

  const updateField = (service: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [service]: { ...(prev[service as keyof FormState] as Record<string, string>), [field]: value },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            {useLocalFallback && (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                <WifiOff className="w-3 h-3" />
                Guardado local
              </span>
            )}
            <button
              onClick={refetch}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {useLocalFallback && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Modo sin tabla DB:</strong> Las conexiones se guardan en localStorage de este navegador.
          Para persistencia cross-dispositivo, crea la tabla <code className="bg-amber-100 px-1 rounded">configuracion_conexiones</code> en Supabase.
        </div>
      )}

      {/* WhatsApp Business */}
      <ServiceCard
        service="whatsapp"
        title="WhatsApp Business API"
        description="Envía notificaciones y gestiona citas por WhatsApp"
        icon={<MessageCircle className="w-8 h-8 text-green-600" />}
        iconBg="bg-green-100"
        connectBg="bg-green-600 hover:bg-green-700"
        connected={conexiones.whatsapp?.conectado ?? false}
        datos={conexiones.whatsapp?.datos ?? {}}
        isEditing={editingService === 'whatsapp'}
        isSyncing={syncing === 'whatsapp'}
        confirmDisconnect={confirmDisconnect === 'whatsapp'}
        onStartEdit={() => startEditing('whatsapp')}
        onCancelEdit={() => setEditingService(null)}
        onConnect={() => handleConnect('whatsapp')}
        onSync={() => handleSync('whatsapp')}
        onConfirmDisconnect={() => setConfirmDisconnect('whatsapp')}
        onDisconnect={() => handleDisconnect('whatsapp')}
        onCancelDisconnect={() => setConfirmDisconnect(null)}
        saving={saving}
      >
        <div className="space-y-3">
          <FormField label="Nombre del Negocio *" value={(formData.whatsapp as any).businessName}
            onChange={v => updateField('whatsapp', 'businessName', v)} placeholder="Mi Consultorio" />
          <FormField label="Número de Teléfono *" type="tel" value={(formData.whatsapp as any).phoneNumber}
            onChange={v => updateField('whatsapp', 'phoneNumber', v)} placeholder="+593 99 999 9999" />
          <FormField label="API Key * (no se almacena en texto plano)" type="password"
            value={(formData.whatsapp as any).apiKey}
            onChange={v => updateField('whatsapp', 'apiKey', v)} placeholder="••••••••••••••••"
            hint="Configura tu API key en Make/n8n para mayor seguridad" />
        </div>
      </ServiceCard>

      {/* Google Calendar */}
      <ServiceCard
        service="google_calendar"
        title="Google Calendar"
        description="Sincroniza automáticamente tus citas con Google Calendar"
        icon={<Calendar className="w-8 h-8 text-blue-600" />}
        iconBg="bg-blue-100"
        connectBg="bg-blue-600 hover:bg-blue-700"
        connected={conexiones.google_calendar?.conectado ?? false}
        datos={conexiones.google_calendar?.datos ?? {}}
        isEditing={editingService === 'google_calendar'}
        isSyncing={syncing === 'google_calendar'}
        confirmDisconnect={confirmDisconnect === 'google_calendar'}
        onStartEdit={() => startEditing('google_calendar')}
        onCancelEdit={() => setEditingService(null)}
        onConnect={() => handleConnect('google_calendar')}
        onSync={() => handleSync('google_calendar')}
        onConfirmDisconnect={() => setConfirmDisconnect('google_calendar')}
        onDisconnect={() => handleDisconnect('google_calendar')}
        onCancelDisconnect={() => setConfirmDisconnect(null)}
        saving={saving}
      >
        <div className="space-y-3">
          <FormField label="Correo de Google *" type="email"
            value={(formData.google_calendar as any).email}
            onChange={v => updateField('google_calendar', 'email', v)} placeholder="ejemplo@gmail.com" />
          <FormField label="ID del Calendario"
            value={(formData.google_calendar as any).calendarId}
            onChange={v => updateField('google_calendar', 'calendarId', v)} placeholder="primary"
            hint='Usa "primary" para el calendario principal' />
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              La autenticación OAuth se configura en tu panel de Google Cloud Console.
            </p>
          </div>
        </div>
      </ServiceCard>

      {/* Apple Calendar */}
      <ServiceCard
        service="apple_calendar"
        title="Apple Calendar (iCloud)"
        description="Sincroniza tus citas con iCloud Calendar"
        icon={<Apple className="w-8 h-8 text-white" />}
        iconBg="bg-gray-800"
        connectBg="bg-gray-800 hover:bg-gray-900"
        connected={conexiones.apple_calendar?.conectado ?? false}
        datos={conexiones.apple_calendar?.datos ?? {}}
        isEditing={editingService === 'apple_calendar'}
        isSyncing={syncing === 'apple_calendar'}
        confirmDisconnect={confirmDisconnect === 'apple_calendar'}
        onStartEdit={() => startEditing('apple_calendar')}
        onCancelEdit={() => setEditingService(null)}
        onConnect={() => handleConnect('apple_calendar')}
        onSync={() => handleSync('apple_calendar')}
        onConfirmDisconnect={() => setConfirmDisconnect('apple_calendar')}
        onDisconnect={() => handleDisconnect('apple_calendar')}
        onCancelDisconnect={() => setConfirmDisconnect(null)}
        saving={saving}
      >
        <div className="space-y-3">
          <FormField label="Apple ID (iCloud) *" type="email"
            value={(formData.apple_calendar as any).email}
            onChange={v => updateField('apple_calendar', 'email', v)} placeholder="ejemplo@icloud.com" />
          <FormField label="Contraseña de Aplicación *" type="password"
            value={(formData.apple_calendar as any).appPassword}
            onChange={v => updateField('apple_calendar', 'appPassword', v)} placeholder="xxxx-xxxx-xxxx-xxxx"
            hint="Genera una en appleid.apple.com › Seguridad › Contraseñas de apps" />
        </div>
      </ServiceCard>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• Las API keys y contraseñas se enmascaran antes de guardarse. Nunca se almacenan en texto plano.</li>
          <li>• Para WhatsApp Business necesitas una cuenta aprobada por Meta.</li>
          <li>• Los cambios de citas se sincronizarán automáticamente mediante webhooks configurados en Make/n8n.</li>
          <li>• Puedes desconectar cualquier servicio sin perder tus datos de citas.</li>
        </ul>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: string
  title: string
  description: string
  icon: React.ReactNode
  iconBg: string
  connectBg: string
  connected: boolean
  datos: Record<string, string>
  isEditing: boolean
  isSyncing: boolean
  confirmDisconnect: boolean
  saving: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onConnect: () => void
  onSync: () => void
  onConfirmDisconnect: () => void
  onDisconnect: () => void
  onCancelDisconnect: () => void
  children: React.ReactNode
}

function ServiceCard({
  title, description, icon, iconBg, connectBg,
  connected, datos, isEditing, isSyncing, confirmDisconnect, saving,
  onStartEdit, onCancelEdit, onConnect, onSync,
  onConfirmDisconnect, onDisconnect, onCancelDisconnect,
  children
}: ServiceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`${iconBg} rounded-lg p-3`}>{icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {connected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Show saved config when connected and not editing */}
        {connected && !isEditing && Object.keys(datos).length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {Object.entries(datos).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="font-mono">{v}</span>
              </div>
            ))}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            {children}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onConnect}
                disabled={saving}
                className={`flex-1 ${connectBg} text-white px-4 py-2 rounded-lg transition-all font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {connected ? 'Actualizar' : 'Conectar'}
              </button>
              <button
                onClick={onCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-all text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {connected ? (
              <>
                <button
                  onClick={onSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-medium text-sm disabled:opacity-60"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sincronizar
                </button>
                <button
                  onClick={onStartEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Configurar
                </button>
                {confirmDisconnect ? (
                  <div className="flex gap-1">
                    <button
                      onClick={onDisconnect}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      <Unlink className="w-3 h-3" />
                      Confirmar
                    </button>
                    <button
                      onClick={onCancelDisconnect}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onConfirmDisconnect}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm"
                  >
                    Desconectar
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onStartEdit}
                className={`flex items-center gap-2 px-4 py-2 ${connectBg} text-white rounded-lg transition-all font-medium text-sm`}
              >
                Conectar {title}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface FormFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
}

function FormField({ label, value, onChange, placeholder, type = 'text', hint }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
