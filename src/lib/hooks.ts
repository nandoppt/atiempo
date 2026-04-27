import { useState, useEffect, useCallback } from 'react'
import { supabase, Cita, Cliente, Servicio, CitaEstado, PlantillaChatbot, ConfiguracionConexion, NotificacionCliente } from './supabase'

// ─── Timezone helper ──────────────────────────────────────────────────────────
function localDayRange(fecha: string) {
  const offset = new Date().getTimezoneOffset()
  const sign = offset <= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const hh = String(Math.floor(absOffset / 60)).padStart(2, '0')
  const mm = String(absOffset % 60).padStart(2, '0')
  const tz = `${sign}${hh}:${mm}`
  return {
    startOfDay: `${fecha}T00:00:00${tz}`,
    endOfDay: `${fecha}T23:59:59${tz}`,
  }
}

// ─── useCitas ─────────────────────────────────────────────────────────────────
export function useCitas(filterEstado?: CitaEstado | 'all') {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('citas')
      .select(`*, clientes ( id, nombre, email, telefono ), servicios ( id, nombre, duracion_minutos, precio )`)
      .order('fecha_hora_inicio', { ascending: true })

    if (filterEstado && filterEstado !== 'all') {
      query = query.eq('estado', filterEstado)
    }

    const { data, error } = await query
    if (error) setError(error.message)
    else setCitas(data ?? [])
    setLoading(false)
  }, [filterEstado])

  useEffect(() => {
    fetchCitas()
    const channel = supabase
      .channel('citas-admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => fetchCitas())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchCitas])

  return { citas, loading, error, refetch: fetchCitas }
}

// ─── useCitasCliente ──────────────────────────────────────────────────────────
export function useCitasCliente(clienteId: string | undefined) {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCitas = useCallback(async () => {
    if (!clienteId) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('citas')
      .select(`*, servicios ( id, nombre, duracion_minutos, precio )`)
      .eq('cliente_id', clienteId)
      .order('fecha_hora_inicio', { ascending: false })

    if (error) setError(error.message)
    else setCitas(data ?? [])
    setLoading(false)
  }, [clienteId])

  useEffect(() => {
    fetchCitas()
    if (!clienteId) return
    const channel = supabase
      .channel(`citas-cliente-${clienteId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'citas',
        filter: `cliente_id=eq.${clienteId}`,
      }, () => fetchCitas())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchCitas, clienteId])

  return { citas, loading, error, refetch: fetchCitas }
}

// ─── useCitasPorFecha ─────────────────────────────────────────────────────────
export function useCitasPorFecha(fecha: string) {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    const { startOfDay, endOfDay } = localDayRange(fecha)
    const { data } = await supabase
      .from('citas')
      .select(`*, clientes ( nombre, email ), servicios ( nombre, duracion_minutos )`)
      .gte('fecha_hora_inicio', startOfDay)
      .lte('fecha_hora_inicio', endOfDay)
      .order('fecha_hora_inicio', { ascending: true })
    setCitas(data ?? [])
    setLoading(false)
  }, [fecha])

  useEffect(() => {
    fetchCitas()
    const channel = supabase
      .channel(`citas-fecha-${fecha}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => fetchCitas())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchCitas, fecha])

  return { citas, loading, refetch: fetchCitas }
}

// ─── useCitasPorMes ───────────────────────────────────────────────────────────
export function useCitasPorMes(year: number, month: number) {
  const [citasPorDia, setCitasPorDia] = useState<Record<string, number>>({})

  const fetchCitas = useCallback(async () => {
    const monthStr = String(month + 1).padStart(2, '0')
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const { startOfDay: start } = localDayRange(`${year}-${monthStr}-01`)
    const { endOfDay: end } = localDayRange(`${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`)

    const { data } = await supabase
      .from('citas')
      .select('fecha_hora_inicio, estado')
      .gte('fecha_hora_inicio', start)
      .lte('fecha_hora_inicio', end)
      .neq('estado', 'cancelada')

    const counts: Record<string, number> = {}
    data?.forEach(c => {
      if (c.fecha_hora_inicio) {
        const localDate = new Date(c.fecha_hora_inicio).toLocaleDateString('en-CA')
        counts[localDate] = (counts[localDate] ?? 0) + 1
      }
    })
    setCitasPorDia(counts)
  }, [year, month])

  useEffect(() => {
    fetchCitas()
    const channel = supabase
      .channel(`citas-mes-${year}-${month}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetchCitas)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchCitas, year, month])

  return citasPorDia
}

// ─── useHorariosDisponibles ───────────────────────────────────────────────────
// Returns available time slots for a given date + service duration
// Business hours: 8am-6pm, slots every 30 min, excludes already-booked times
export function useHorariosDisponibles(fecha: string, duracionMinutos: number) {
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHorarios = useCallback(async () => {
    if (!fecha || !duracionMinutos) { setHorariosDisponibles([]); return }
    setLoading(true)

    const { startOfDay, endOfDay } = localDayRange(fecha)

    // Get existing appointments for that day (not cancelled)
    const { data: citasDelDia } = await supabase
      .from('citas')
      .select('fecha_hora_inicio, servicios(duracion_minutos)')
      .gte('fecha_hora_inicio', startOfDay)
      .lte('fecha_hora_inicio', endOfDay)
      .neq('estado', 'cancelada')

    // Build occupied intervals
    const ocupados: Array<{ inicio: Date; fin: Date }> = []
    citasDelDia?.forEach((c: any) => {
      if (c.fecha_hora_inicio) {
        const inicio = new Date(c.fecha_hora_inicio)
        const duracion = c.servicios?.duracion_minutos ?? 60
        const fin = new Date(inicio.getTime() + duracion * 60000)
        ocupados.push({ inicio, fin })
      }
    })

    // Generate slots from 08:00 to 18:00 every 30 minutes
    const slots: string[] = []
    const [y, m, d] = fecha.split('-').map(Number)
    const now = new Date()

    for (let hour = 8; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const slotStart = new Date(y, m - 1, d, hour, min, 0)
        const slotEnd = new Date(slotStart.getTime() + duracionMinutos * 60000)

        // Skip past slots
        if (slotStart <= now) continue

        // Skip if slot end goes past closing time (18:00)
        const closing = new Date(y, m - 1, d, 18, 0, 0)
        if (slotEnd > closing) continue

        // Check overlap with existing appointments
        const hasOverlap = ocupados.some(o =>
          slotStart < o.fin && slotEnd > o.inicio
        )

        if (!hasOverlap) {
          slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
        }
      }
    }

    setHorariosDisponibles(slots)
    setLoading(false)
  }, [fecha, duracionMinutos])

  useEffect(() => {
    fetchHorarios()
  }, [fetchHorarios])

  return { horariosDisponibles, loading, refetch: fetchHorarios }
}

// ─── useClientes ──────────────────────────────────────────────────────────────
export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('clientes').select('*').order('fecha_registro', { ascending: false })
      .then(({ data }) => { setClientes(data ?? []); setLoading(false) })
  }, [])

  return { clientes, loading }
}

// ─── useServicios ─────────────────────────────────────────────────────────────
export function useServicios(soloActivos = false) {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase.from('servicios').select('*')
    if (soloActivos) query = query.eq('activo', true)
    query.order('nombre', { ascending: true })
      .then(({ data }) => { setServicios(data ?? []); setLoading(false) })
  }, [soloActivos])

  return { servicios, loading }
}

// ─── useAdminStats ────────────────────────────────────────────────────────────
export function useAdminStats() {
  const [stats, setStats] = useState({
    citasHoy: 0,
    totalClientes: 0,
    completadas: 0,
    pendientes: 0,
    confirmadas: 0,
    canceladas: 0,
    citasSemana: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const hoy = new Date().toLocaleDateString('en-CA')
    const { startOfDay, endOfDay } = localDayRange(hoy)

    // Start of current week (Monday)
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const [citasHoy, totalClientes, completadas, pendientes, confirmadas, canceladas, citasSemana] =
      await Promise.all([
        supabase.from('citas').select('id', { count: 'exact', head: true }).gte('fecha_hora_inicio', startOfDay).lte('fecha_hora_inicio', endOfDay),
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'completada'),
        supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'confirmada'),
        supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'cancelada'),
        supabase.from('citas').select('id', { count: 'exact', head: true })
          .gte('fecha_hora_inicio', startOfWeek.toISOString())
          .lte('fecha_hora_inicio', endOfWeek.toISOString())
          .neq('estado', 'cancelada'),
      ])

    setStats({
      citasHoy: citasHoy.count ?? 0,
      totalClientes: totalClientes.count ?? 0,
      completadas: completadas.count ?? 0,
      pendientes: pendientes.count ?? 0,
      confirmadas: confirmadas.count ?? 0,
      canceladas: canceladas.count ?? 0,
      citasSemana: citasSemana.count ?? 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    const channel = supabase
      .channel('stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchStats)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchStats])

  return { stats, loading }
}

// ─── useCitasPendientes ───────────────────────────────────────────────────────
export function useCitasPendientes() {
  const [pendientes, setPendientes] = useState<Cita[]>([])

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('citas')
      .select(`*, clientes ( nombre, email, telefono ), servicios ( nombre, duracion_minutos )`)
      .eq('estado', 'pendiente')
      .order('fecha_creacion', { ascending: false })
    setPendientes(data ?? [])
  }, [])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('pendientes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch])

  return { pendientes, refetch: fetch }
}

// ─── usePlantillasChatbot ─────────────────────────────────────────────────────
// Tries to load from Supabase table `plantillas_chatbot`.
// Falls back gracefully to defaults if table doesn't exist yet.
const DEFAULT_PLANTILLAS: PlantillaChatbot[] = [
  { id: '1', nombre: 'Bienvenida', trigger: 'inicio', mensaje: '¡Hola! 👋 Bienvenido a nuestro sistema de agendamiento. ¿En qué puedo ayudarte hoy?', activo: true },
  { id: '2', nombre: 'Confirmar Cita', trigger: 'confirmacion', mensaje: '✅ Tu cita ha sido confirmada para el {fecha} a las {hora}. Te enviaremos un recordatorio 24 horas antes.', activo: true },
  { id: '3', nombre: 'Recordatorio 24h', trigger: 'recordatorio_24h', mensaje: '⏰ Recordatorio: Tienes una cita mañana a las {hora} para {servicio}. ¿Confirmas tu asistencia?', activo: true },
  { id: '4', nombre: 'Cancelación', trigger: 'cancelacion', mensaje: 'Tu cita para el {fecha} a las {hora} ha sido cancelada. ¿Deseas agendar una nueva fecha?', activo: true },
  { id: '5', nombre: 'Reagendar', trigger: 'reagendar', mensaje: '📅 ¿Qué fecha te gustaría para tu nueva cita? Por favor, indica día y hora preferida.', activo: false },
  { id: '6', nombre: 'Horarios Disponibles', trigger: 'horarios', mensaje: 'Estos son los horarios disponibles para {fecha}:\n\n{lista_horarios}\n\n¿Cuál prefieres?', activo: true },
]

export function usePlantillasChatbot() {
  const [plantillas, setPlantillas] = useState<PlantillaChatbot[]>(DEFAULT_PLANTILLAS)
  const [loading, setLoading] = useState(true)
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  const fetchPlantillas = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('plantillas_chatbot')
      .select('*')
      .order('nombre', { ascending: true })

    if (error || !data) {
      // Table doesn't exist yet — use in-memory defaults
      setUseLocalFallback(true)
      setPlantillas(DEFAULT_PLANTILLAS)
    } else {
      setUseLocalFallback(false)
      setPlantillas(data.length > 0 ? data : DEFAULT_PLANTILLAS)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlantillas() }, [fetchPlantillas])

  const updatePlantilla = useCallback(async (id: string, updates: Partial<PlantillaChatbot>) => {
    if (useLocalFallback) {
      setPlantillas(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      return { error: null }
    }
    const { error } = await supabase.from('plantillas_chatbot').update(updates).eq('id', id)
    if (!error) fetchPlantillas()
    return { error }
  }, [useLocalFallback, fetchPlantillas])

  const createPlantilla = useCallback(async (plantilla: Omit<PlantillaChatbot, 'id'>) => {
    if (useLocalFallback) {
      const newId = String(Date.now())
      setPlantillas(prev => [...prev, { ...plantilla, id: newId }])
      return { error: null }
    }
    const { error } = await supabase.from('plantillas_chatbot').insert(plantilla)
    if (!error) fetchPlantillas()
    return { error }
  }, [useLocalFallback, fetchPlantillas])

  const deletePlantilla = useCallback(async (id: string) => {
    if (useLocalFallback) {
      setPlantillas(prev => prev.filter(p => p.id !== id))
      return { error: null }
    }
    const { error } = await supabase.from('plantillas_chatbot').delete().eq('id', id)
    if (!error) fetchPlantillas()
    return { error }
  }, [useLocalFallback, fetchPlantillas])

  return { plantillas, loading, useLocalFallback, updatePlantilla, createPlantilla, deletePlantilla, refetch: fetchPlantillas }
}

// ─── useConfiguracionConexiones ───────────────────────────────────────────────
// Persists connection config in Supabase table `configuracion_conexiones`.
// Falls back to localStorage if table doesn't exist.
const CONEXIONES_DEFAULT: Record<string, ConfiguracionConexion> = {
  whatsapp: { id: 'whatsapp', servicio: 'whatsapp', conectado: false, datos: {} },
  google_calendar: { id: 'google_calendar', servicio: 'google_calendar', conectado: false, datos: {} },
  apple_calendar: { id: 'apple_calendar', servicio: 'apple_calendar', conectado: false, datos: {} },
}

export function useConfiguracionConexiones() {
  const [conexiones, setConexiones] = useState<Record<string, ConfiguracionConexion>>(CONEXIONES_DEFAULT)
  const [loading, setLoading] = useState(true)
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  const fetchConexiones = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('configuracion_conexiones')
      .select('*')

    if (error || !data) {
      // Try localStorage fallback
      setUseLocalFallback(true)
      try {
        const stored = localStorage.getItem('conexiones_config')
        if (stored) setConexiones(JSON.parse(stored))
      } catch { /* ignore */ }
    } else {
      setUseLocalFallback(false)
      const map: Record<string, ConfiguracionConexion> = { ...CONEXIONES_DEFAULT }
      data.forEach((c: ConfiguracionConexion) => { map[c.servicio] = c })
      setConexiones(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchConexiones() }, [fetchConexiones])

  const saveConexion = useCallback(async (servicio: string, updates: Partial<ConfiguracionConexion>) => {
    const updated = { ...conexiones[servicio], ...updates, servicio }

    if (useLocalFallback) {
      const newState = { ...conexiones, [servicio]: updated }
      setConexiones(newState)
      try { localStorage.setItem('conexiones_config', JSON.stringify(newState)) } catch { /* ignore */ }
      return { error: null }
    }

    const { error } = await supabase
      .from('configuracion_conexiones')
      .upsert({ ...updated, updated_at: new Date().toISOString() }, { onConflict: 'servicio' })

    if (!error) fetchConexiones()
    return { error }
  }, [conexiones, useLocalFallback, fetchConexiones])

  const disconnectConexion = useCallback(async (servicio: string) => {
    return saveConexion(servicio, { conectado: false, datos: {} })
  }, [saveConexion])

  return { conexiones, loading, useLocalFallback, saveConexion, disconnectConexion, refetch: fetchConexiones }
}

// ─── useNotificacionesCliente ─────────────────────────────────────────────────
// Loads real notification history for a client based on their appointment status changes.
// Falls back to deriving notifications from their appointments if table doesn't exist.
export function useNotificacionesCliente(clienteId: string | undefined) {
  const [notificaciones, setNotificaciones] = useState<NotificacionCliente[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotificaciones = useCallback(async () => {
    if (!clienteId) { setLoading(false); return }
    setLoading(true)

    // Try dedicated notifications table first
    const { data, error } = await supabase
      .from('notificaciones_cliente')
      .select('*, citas(*, servicios(nombre))')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error || !data) {
      // Fallback: derive notifications from appointment status changes
      const { data: citasData } = await supabase
        .from('citas')
        .select('*, servicios(nombre)')
        .eq('cliente_id', clienteId)
        .order('fecha_creacion', { ascending: false })
        .limit(10)

      const derived: NotificacionCliente[] = (citasData ?? []).map((c: any) => {
        const servicio = c.servicios?.nombre ?? 'Cita'
        const fecha = c.fecha_hora_inicio
          ? new Date(c.fecha_hora_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
          : '—'
        const hora = c.fecha_hora_inicio
          ? new Date(c.fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : '—'

        const mensajes: Record<string, string> = {
          confirmada: `✅ Tu cita de ${servicio} el ${fecha} a las ${hora} fue confirmada.`,
          pendiente: `⏳ Tu cita de ${servicio} el ${fecha} a las ${hora} está pendiente de aprobación.`,
          cancelada: `❌ Tu cita de ${servicio} el ${fecha} a las ${hora} fue cancelada.`,
          completada: `🎉 Tu cita de ${servicio} el ${fecha} a las ${hora} fue completada.`,
        }

        return {
          id: c.id,
          cliente_id: clienteId,
          cita_id: c.id,
          tipo: (c.estado ?? 'pendiente') as NotificacionCliente['tipo'],
          mensaje: mensajes[c.estado ?? 'pendiente'] ?? mensajes['pendiente'],
          leida: c.estado === 'completada' || c.estado === 'cancelada',
          created_at: c.fecha_creacion ?? new Date().toISOString(),
          citas: c,
        }
      })
      setNotificaciones(derived)
    } else {
      setNotificaciones(data)
    }
    setLoading(false)
  }, [clienteId])

  useEffect(() => {
    fetchNotificaciones()
    if (!clienteId) return
    const channel = supabase
      .channel(`notif-cliente-${clienteId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'citas',
        filter: `cliente_id=eq.${clienteId}`,
      }, fetchNotificaciones)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchNotificaciones, clienteId])

  const marcarLeida = useCallback(async (id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    await supabase.from('notificaciones_cliente').update({ leida: true }).eq('id', id)
  }, [])

  const marcarTodasLeidas = useCallback(async () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    if (clienteId) {
      await supabase.from('notificaciones_cliente').update({ leida: true }).eq('cliente_id', clienteId)
    }
  }, [clienteId])

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return { notificaciones, loading, noLeidas, marcarLeida, marcarTodasLeidas, refetch: fetchNotificaciones }
}

// ─── useServicios admin (with CRUD) ──────────────────────────────────────────
export function useServiciosAdmin() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)

  const fetchServicios = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('servicios').select('*').order('nombre', { ascending: true })
    setServicios(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchServicios() }, [fetchServicios])

  const createServicio = async (s: Omit<Servicio, 'id'>) => {
    const { error } = await supabase.from('servicios').insert(s)
    if (!error) fetchServicios()
    return { error }
  }

  const updateServicio = async (id: string, s: Partial<Servicio>) => {
    const { error } = await supabase.from('servicios').update(s).eq('id', id)
    if (!error) fetchServicios()
    return { error }
  }

  const deleteServicio = async (id: string) => {
    const { error } = await supabase.from('servicios').delete().eq('id', id)
    if (!error) fetchServicios()
    return { error }
  }

  return { servicios, loading, createServicio, updateServicio, deleteServicio, refetch: fetchServicios }
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────
export async function updateEstadoCita(id: string, estado: CitaEstado) {
  const { error } = await supabase.from('citas').update({ estado }).eq('id', id)
  return { error }
}

export async function deleteCita(id: string) {
  const { error } = await supabase.from('citas').delete().eq('id', id)
  return { error }
}

export async function crearCita(cita: {
  cliente_id: string
  servicio_id: string
  fecha_hora_inicio: string
  estado: CitaEstado
  notas?: string
}) {
  const { data, error } = await supabase
    .from('citas')
    .insert({ ...cita, fecha_creacion: new Date().toISOString() })
    .select()
    .single()
  return { data, error }
}
