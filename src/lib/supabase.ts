import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Database Types ───────────────────────────────────────────────────────────

export type CitaEstado = 'confirmada' | 'pendiente' | 'cancelada' | 'completada'

export interface Cita {
  id: string
  cliente_id: string
  servicio_id: string | null
  fecha_hora_inicio: string | null
  estado: CitaEstado | null
  fecha_creacion: string | null
  // Joined
  clientes?: Cliente
  servicios?: Servicio
}

export interface Cliente {
  id: string
  nombre: string | null
  email: string
  telefono: string | null
  fecha_registro: string | null
}

export interface Servicio {
  id: string
  nombre: string
  duracion_minutos: number | null
  activo: boolean | null
}

export interface Configuracion {
  id: number
  mensaje_bienvenida: string
  horas_minimas_cancelacion: number | null
}

// Optional tables — created manually in Supabase if desired
export interface PlantillaChatbot {
  id: string
  nombre: string
  trigger: string
  mensaje: string
  activo: boolean
  created_at?: string
}

export interface NotificacionCliente {
  id: string
  cliente_id: string
  cita_id: string
  tipo: 'confirmada' | 'cancelada' | 'recordatorio' | 'pendiente' | 'completada'
  mensaje: string
  leida: boolean
  created_at: string
  citas?: Cita
}

export type UserRole = 'admin' | 'cliente'
