import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, Cita, Cliente, Servicio, CitaEstado, PlantillaChatbot, NotificacionCliente } from './supabase'

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

// Each hook instance gets a unique channel name to avoid Supabase conflicts
let _channelSeq = 0
function mkChannel(base: string) {
  return `${base}-${++_channelSeq}-${Date.now()}`
}

// ─── useCitas ─────────────────────────────────────────────────────────────────
export function useCitas(filterEstado?: CitaEstado | 'all') {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chRef = useRef<any>(null)

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('citas')
      .select(`
        id, cliente_id, servicio_id, fecha_hora_inicio, estado, fecha_creacion,
        clientes ( id, nombre, email, telefono ),
        servicios ( id, nombre, duracion_minutos )
      `)
      .order('fecha_hora_inicio', { ascending: true })

    if (filterEstado && filterEstado !== 'all') {
      query = query.eq('estado', filterEstado)
    }

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setCitas((data as unknown as Cita[]) ?? [])
    setLoading(false)
  }, [filterEstado])

  useEffect(() => {
    fetchCitas()
    const ch = supabase
      .channel(mkChannel('citas-admin'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetchCitas)
      .subscribe()
    chRef.current = ch
    return () => { supabase.removeChannel(chRef.current); chRef.current = null }
  }, [fetchCitas])

  return { citas, loading, error, refetch: fetchCitas }
}

// ─── useCitasCliente ──────────────────────────────────────────────────────────
export function useCitasCliente(clienteId: string | undefined) {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chRef = useRef<any>(null)

  const fetchCitas = useCallback(async () => {
    if (!clienteId) { setLoading(false); return }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('citas')
      .select(`
        id, cliente_id, servicio_id, fecha_hora_inicio, estado, fecha_creacion,
        servicios ( id, nombre, duracion_minutos )
      `)
      .eq('cliente_id', clienteId)
      .order('fecha_hora_inicio', { ascending: false })

    if (err) setError(err.message)
    else setCitas((data as unknown as Cita[]) ?? [])
    setLoading(false)
  }, [clienteId])

  useEffect(() => {
    fetchCitas()
    if (!clienteId) return
    const ch = supabase
      .channel(mkChannel(`citas-cli-${clienteId.slice(0, 8)}`))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'citas',
        filter: `cliente_id=eq.${clienteId}`,
      }, fetchCitas)
      .subscribe()
    chRef.current = ch
    return () => { supabase.removeChannel(chRef.current); chRef.current = null }
  }, [fetchCitas, clienteId])

  return { citas, loading, error, refetch: fetchCitas }
}

// ─── useCitasPorFecha ─────────────────────────────────────────────────────────
export function useCitasPorFecha(fecha: string) {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const chRef = useRef<any>(null)

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    const { startOfDay, endOfDay } = localDayRange(fecha)
    const { data } = await supabase
      .from('citas')
      .select(`
        id, cliente_id, servicio_id, fecha_hora_inicio, estado, fecha_creacion,
        clientes ( nombre, email ),
        servicios ( nombre, duracion_minutos )
      `)
      .gte('fecha_hora_inicio', startOfDay)
      .lte('fecha_hora_inicio', endOfDay)
      .order('fecha_hora_inicio', { ascending: true })
    setCitas((data as unknown as Cita[]) ?? [])
    setLoading(false)
  }, [fecha])

  useEffect(() => {
    fetchCitas()
    const ch = supabase
      .channel(mkChannel(`citas-fecha`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetchCitas)
      .subscribe()
    chRef.current = ch
    return () => { supabase.removeChannel(chRef.current); chRef.current = null }
  }, [fetchCitas, fecha])

  return { citas, loading, refetch: fetchCitas }
}

// ─── useCitasPorMes ───────────────────────────────────────────────────────────
export function useCitasPorMes(year: number, month: number) {
  const [citasPorDia, setCitasPorDia] = useState<Record<string, number>>({})
  const chRef = useRef<any>(null)

  const fetchCitas = useCallback(async () => {
    const monthStr = String(month + 1).padStart(2, '0')
    const lastDay = new Date(year, month + 1, 0).getDate()
    const { startOfDay: start } = localDayRange(`${year}-${monthStr}-01`)
    const { endOfDay: end } = localDayRange(`${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`)

    const { data } = await supabase
      .from('citas')
      .select('fecha_hora_inicio, estado')
      .gte('fecha_hora_inicio', start)
      .lte('fecha_hora_inicio', end)
      .neq('estado', 'cancelada')

    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((c: any) => {
      if (c.fecha_hora_inicio) {
        const key = new Date(c.fecha_hora_inicio).toLocaleDateString('en-CA')
        counts[key] = (counts[key] ?? 0) + 1
      }
    })
    setCitasPorDia(counts)
  }, [year, month])

  useEffect(() => {
    fetchCitas()
    const ch = supabase
      .channel(mkChannel(`citas-mes`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetchCitas)
      .subscribe()
    chRef.current = ch
    return () => { supabase.removeChannel(chRef.current); chRef.current = null }
  }, [fetchCitas, year, month])

  return citasPorDia
}

// ─── useHorariosDisponibles ───────────────────────────────────────────────────
export function useHorariosDisponibles(fecha: string, duracionMinutos: number) {
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHorarios = useCallback(async () => {
    if (!fecha || !duracionMinutos) { setHorariosDisponibles([]); return }
    setLoading(true)

    const { startOfDay, endOfDay } = localDayRange(fecha)
    const { data: citasDelDia } = await supabase
      .from('citas')
      .select('fecha_hora_inicio, servicios(duracion_minutos)')
      .gte('fecha_hora_inicio', startOfDay)
      .lte('fecha_hora_inicio', endOfDay)
      .neq('estado', 'cancelada')

    const ocupados: Array<{ inicio: Date; fin: Date }> = []
    ;(citasDelDia ?? []).forEach((c: any) => {
      if (c.fecha_hora_inicio) {
        const inicio = new Date(c.fecha_hora_inicio)
        const dur = c.servicios?.duracion_minutos ?? 60
        ocupados.push({ inicio, fin: new Date(inicio.getTime() + dur * 60000) })
      }
    })

    const slots: string[] = []
    const [y, m, d] = fecha.split('-').map(Number)
    const now = new Date()

    for (let hour = 8; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const slotStart = new Date(y, m - 1, d, hour, min, 0)
        const slotEnd = new Date(slotStart.getTime() + duracionMinutos * 60000)
        if (slotStart <= now) continue
        if (slotEnd > new Date(y, m - 1, d, 18, 0, 0)) continue
        const busy = ocupados.some(o => slotStart < o.fin && slotEnd > o.inicio)
        if (!busy) slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
      }
    }

    setHorariosDisponibles(slots)
    setLoading(false)
  }, [fecha, duracionMinutos])

  useEffect(() => { fetchHorarios() }, [fetchHorarios])

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
    let query = supabase.from('servicios').select('id, nombre, duracion_minutos, activo')
    if (soloActivos) query = query.eq('activo', true)
    query.order('nombre', { ascending: true })
      .then(({ data }) => { setServicios((data as Servicio[]) ?? []); setLoading(false) })
  }, [soloActivos])

  return { servicios, loading }
}

// ─── useAdminStats ────────────────────────────────────────────────────────────
export function useAdminStats() {
  const [stats, setStats] = useState({
    citasHoy: 0, totalClientes: 0, completadas: 0,
    pendientes: 0, confirmadas: 0, canceladas: 0, citasSemana: 0,
  })
  const [loading, setLoading] = useState(true)
  const chRef = useRef<any>(null)

  const fetchStats = useCallback(async () => {
    const hoy = new Date().toLocaleDateString('en-CA')
    const { startOfDay, endOfDay } = localDayRange(hoy)

    const now = new Date()
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dow)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const [a, b, c, d, e, f, g] = await Promise.all([
      supabase.from('citas').select('id', { count: 'exact', head: true }).gte('fecha_hora_inicio', startOfDay).lte('fecha_hora_inicio', endOfDay),
      supabase.from('clientes').select('id', { count: 'exact', head: true }),
      supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'completada'),
      supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'confirmada'),
      supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'cancelada'),
      supabase.from('citas').select('id', { count: 'exact', head: true }).gte('fecha_hora_inicio', weekStart.toISOString()).lte('fecha_hora_inicio', weekEnd.toISOString()).neq('estado', 'cancelada'),
    ])

    setStats({
      citasHoy: a.count ?? 0,
      totalClientes: b.count ?? 0,
      completadas: c.count ?? 0,
      pendientes: d.count ?? 0,
      confirmadas: e.count ?? 0,
      canceladas: f.count ?? 0,
      citasSemana: g.count ?? 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    const ch = supabase
      .channel(mkChannel('stats'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchStats)
      .subscribe()
    chRef.current = ch
    return () => { supabase.removeChannel(chRef.current); chRef.current = null }
  }, [fetchStats])

  return { stats, loading }
}

// ─── useCitasPendientes ───────────────────────────────────────────────────────
export function useCitasPendientes() {
  const [pendientes, setPendientes] = useState<Cita[]>([])
  const chRef = useRef<any>(null)

  const fetchPendientes = useCallback(async () => {
    const { data } = await supabase
      .from('citas')
      .select(`
        id, cliente_id, servicio_id, fecha_hora_inicio, estado, fecha_creacion,
        clientes ( nombre, email, telefono ),
        servicios ( nombre, duracion_minutos )
      `)
      .eq('estado', 'pendiente')
      .order('fecha_creacion', { ascending: false })
    setPendientes((data as unknown as Cita[]) ?? [])
  }, [])

  useEffect(() => {
    fetchPendientes()
    const ch = supabase
      .channel(mkChannel('citas-pend'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetchPendientes)
      .subscribe()
    chRef.current = ch
    return () => { supabase.removeChannel(chRef.current); chRef.current = null }
  }, [fetchPendientes])

  return { pendientes, refetch: fetchPendientes }
}

// ─── usePlantillasChatbot ─────────────────────────────────────────────────────
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
    try {
      const { data, error } = await supabase.from('plantillas_chatbot').select('*').order('nombre')
      if (error || !data) { setUseLocalFallback(true) }
      else { setUseLocalFallback(false); setPlantillas(data.length > 0 ? data as PlantillaChatbot[] : DEFAULT_PLANTILLAS) }
    } catch { setUseLocalFallback(true) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlantillas() }, [fetchPlantillas])

  const updatePlantilla = useCallback(async (id: string, updates: Partial<PlantillaChatbot>) => {
    if (useLocalFallback) { setPlantillas(p => p.map(x => x.id === id ? { ...x, ...updates } : x)); return { error: null } }
    const { error } = await supabase.from('plantillas_chatbot').update(updates).eq('id', id)
    if (!error) fetchPlantillas()
    return { error }
  }, [useLocalFallback, fetchPlantillas])

  const createPlantilla = useCallback(async (p: Omit<PlantillaChatbot, 'id'>) => {
    if (useLocalFallback) { setPlantillas(prev => [...prev, { ...p, id: String(Date.now()) }]); return { error: null } }
    const { error } = await supabase.from('plantillas_chatbot').insert(p)
    if (!error) fetchPlantillas()
    return { error }
  }, [useLocalFallback, fetchPlantillas])

  const deletePlantilla = useCallback(async (id: string) => {
    if (useLocalFallback) { setPlantillas(p => p.filter(x => x.id !== id)); return { error: null } }
    const { error } = await supabase.from('plantillas_chatbot').delete().eq('id', id)
    if (!error) fetchPlantillas()
    return { error }
  }, [useLocalFallback, fetchPlantillas])

  return { plantillas, loading, useLocalFallback, updatePlantilla, createPlantilla, deletePlantilla, refetch: fetchPlantillas }
}

// ─── useConfiguracionConexiones ───────────────────────────────────────────────
type ServicioKey = 'whatsapp' | 'google_calendar' | 'apple_calendar'
interface ConexionState { conectado: boolean; datos: Record<string, string> }
const CONEXIONES_DEFAULT: Record<ServicioKey, ConexionState> = {
  whatsapp: { conectado: false, datos: {} },
  google_calendar: { conectado: false, datos: {} },
  apple_calendar: { conectado: false, datos: {} },
}

export function useConfiguracionConexiones() {
  const [conexiones, setConexiones] = useState<Record<ServicioKey, ConexionState>>(CONEXIONES_DEFAULT)
  const [loading, setLoading] = useState(true)
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  const fetchConexiones = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('configuracion_conexiones').select('*')
      if (error || !data) {
        setUseLocalFallback(true)
        try { const s = localStorage.getItem('conexiones_config'); if (s) setConexiones(JSON.parse(s)) } catch { /* */ }
      } else {
        setUseLocalFallback(false)
        const map = { ...CONEXIONES_DEFAULT } as Record<ServicioKey, ConexionState>
        data.forEach((c: any) => { if (c.servicio in map) map[c.servicio as ServicioKey] = { conectado: c.conectado ?? false, datos: c.datos ?? {} } })
        setConexiones(map)
      }
    } catch {
      setUseLocalFallback(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchConexiones() }, [fetchConexiones])

  const saveConexion = useCallback(async (servicio: string, updates: Partial<ConexionState>) => {
    const newState = { ...conexiones, [servicio]: { ...conexiones[servicio as ServicioKey], ...updates } }
    setConexiones(newState)
    if (useLocalFallback) {
      try { localStorage.setItem('conexiones_config', JSON.stringify(newState)) } catch { /* */ }
      return { error: null }
    }
    const { error } = await supabase.from('configuracion_conexiones').upsert(
      { servicio, conectado: updates.conectado ?? false, datos: updates.datos ?? {}, updated_at: new Date().toISOString() },
      { onConflict: 'servicio' }
    )
    return { error }
  }, [conexiones, useLocalFallback])

  const disconnectConexion = useCallback(async (servicio: string) => {
    return saveConexion(servicio, { conectado: false, datos: {} })
  }, [saveConexion])

  return { conexiones, loading, useLocalFallback, saveConexion, disconnectConexion, refetch: fetchConexiones }
}

// ─── useNotificacionesCliente ─────────────────────────────────────────────────
export function useNotificacionesCliente(clienteId: string | undefined) {
  const [notificaciones, setNotificaciones] = useState<NotificacionCliente[]>([])
  const [loading, setLoading] = useState(true)
  const chRef = useRef<any>(null)

  const fetchNotificaciones = useCallback(async () => {
    if (!clienteId) { setLoading(false); return }
    setLoading(true)

    const { data } = await supabase
      .from('citas')
      .select('id, estado, fecha_hora_inicio, fecha_creacion, servicios(nombre)')
      .eq('cliente_id', clienteId)
      .order('fecha_creacion', { ascending: false })
      .limit(20)

    const derived: NotificacionCliente[] = (data ?? []).map((c: any) => {
      const servicio = c.servicios?.nombre ?? 'Cita'
      const fechaHora = c.fecha_hora_inicio ? new Date(c.fecha_hora_inicio) : null
      const fecha = fechaHora ? fechaHora.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'
      const hora = fechaHora ? fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'
      const mensajes: Record<string, string> = {
        confirmada: `✅ Tu cita de ${servicio} el ${fecha} a las ${hora} fue confirmada.`,
        pendiente: `⏳ Tu solicitud de ${servicio} el ${fecha} a las ${hora} está pendiente de aprobación.`,
        cancelada: `❌ Tu cita de ${servicio} el ${fecha} a las ${hora} fue cancelada.`,
        completada: `🎉 Tu cita de ${servicio} el ${fecha} fue completada exitosamente.`,
      }
      const estado = c.estado ?? 'pendiente'
      return {
        id: c.id, cliente_id: clienteId, cita_id: c.id,
        tipo: estado as NotificacionCliente['tipo'],
        mensaje: mensajes[estado] ?? mensajes['pendiente'],
        leida: estado === 'completada',
        created_at: c.fecha_creacion ?? new Date().toISOString(),
      }
    })
    setNotificaciones(derived)
    setLoading(false)
  }, [clienteId])

  useEffect(() => {
    fetchNotificaciones()
    if (!clienteId) return
    const ch = supabase
      .channel(mkChannel(`notif-cli`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas', filter: `cliente_id=eq.${clienteId}` }, fetchNotificaciones)
      .subscribe()
    chRef.current = ch
    return () => { supabase.removeChannel(chRef.current); chRef.current = null }
  }, [fetchNotificaciones, clienteId])

  const marcarLeida = useCallback((id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }, [])

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }, [])

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return { notificaciones, loading, noLeidas, marcarLeida, marcarTodasLeidas, refetch: fetchNotificaciones }
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
  cliente_id: string; servicio_id: string
  fecha_hora_inicio: string; estado: CitaEstado
}) {
  const { data, error } = await supabase
    .from('citas')
    .insert({ ...cita, fecha_creacion: new Date().toISOString() })
    .select().single()
  return { data, error }
}
