import { useState, useEffect, useCallback } from 'react'
import { supabase, Cita, Cliente, Servicio, CitaEstado } from './supabase'

// ─── useCitas ─────────────────────────────────────────────────────────────────
// Fetches all citas joined with clientes and servicios (admin view)

export function useCitas(filterEstado?: CitaEstado | 'all') {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('citas')
      .select(`
        *,
        clientes ( id, nombre, email, telefono ),
        servicios ( id, nombre, duracion_minutos )
      `)
      .order('fecha_hora_inicio', { ascending: true })

    if (filterEstado && filterEstado !== 'all') {
      query = query.eq('estado', filterEstado)
    }

    const { data, error } = await query
    if (error) setError(error.message)
    else setCitas(data ?? [])
    setLoading(false)
  }, [filterEstado])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  return { citas, loading, error, refetch: fetchCitas }
}

// ─── useCitasCliente ──────────────────────────────────────────────────────────
// Fetches citas for a specific cliente_id

export function useCitasCliente(clienteId: string | undefined) {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCitas = useCallback(async () => {
    if (!clienteId) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('citas')
      .select(`*, servicios ( id, nombre, duracion_minutos )`)
      .eq('cliente_id', clienteId)
      .order('fecha_hora_inicio', { ascending: false })

    if (error) setError(error.message)
    else setCitas(data ?? [])
    setLoading(false)
  }, [clienteId])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  return { citas, loading, error, refetch: fetchCitas }
}

// ─── useCitasPorFecha ─────────────────────────────────────────────────────────
// Fetches citas for a specific date (calendar view)

export function useCitasPorFecha(fecha: string) {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCitas = async () => {
      setLoading(true)
      const startOfDay = `${fecha}T00:00:00+00:00`
      const endOfDay = `${fecha}T23:59:59+00:00`

      const { data } = await supabase
        .from('citas')
        .select(`*, clientes ( nombre ), servicios ( nombre, duracion_minutos )`)
        .gte('fecha_hora_inicio', startOfDay)
        .lte('fecha_hora_inicio', endOfDay)
        .order('fecha_hora_inicio', { ascending: true })

      setCitas(data ?? [])
      setLoading(false)
    }
    fetchCitas()
  }, [fecha])

  return { citas, loading }
}

// ─── useClientes ──────────────────────────────────────────────────────────────

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('clientes')
      .select('*')
      .order('fecha_registro', { ascending: false })
      .then(({ data }) => {
        setClientes(data ?? [])
        setLoading(false)
      })
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
    query.then(({ data }) => {
      setServicios(data ?? [])
      setLoading(false)
    })
  }, [soloActivos])

  return { servicios, loading }
}

// ─── useAdminStats ────────────────────────────────────────────────────────────
// Computes dashboard stats from Supabase

export function useAdminStats() {
  const [stats, setStats] = useState({
    citasHoy: 0,
    totalClientes: 0,
    completadas: 0,
    pendientes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const hoy = new Date().toISOString().split('T')[0]
      const startOfDay = `${hoy}T00:00:00+00:00`
      const endOfDay = `${hoy}T23:59:59+00:00`

      const [citasHoy, totalClientes, completadas, pendientes] = await Promise.all([
        supabase
          .from('citas')
          .select('id', { count: 'exact', head: true })
          .gte('fecha_hora_inicio', startOfDay)
          .lte('fecha_hora_inicio', endOfDay),
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('citas')
          .select('id', { count: 'exact', head: true })
          .eq('estado', 'completada'),
        supabase
          .from('citas')
          .select('id', { count: 'exact', head: true })
          .eq('estado', 'pendiente'),
      ])

      setStats({
        citasHoy: citasHoy.count ?? 0,
        totalClientes: totalClientes.count ?? 0,
        completadas: completadas.count ?? 0,
        pendientes: pendientes.count ?? 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  return { stats, loading }
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

export async function updateEstadoCita(id: string, estado: CitaEstado) {
  const { error } = await supabase
    .from('citas')
    .update({ estado })
    .eq('id', id)
  return { error }
}

export async function deleteCita(id: string) {
  const { error } = await supabase
    .from('citas')
    .delete()
    .eq('id', id)
  return { error }
}

export async function crearCita(cita: {
  cliente_id: string
  servicio_id: string
  fecha_hora_inicio: string
  estado: CitaEstado
}) {
  const { data, error } = await supabase
    .from('citas')
    .insert({ ...cita, fecha_creacion: new Date().toISOString() })
    .select()
    .single()
  return { data, error }
}
