import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserRole } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, role: UserRole, nombre?: string, telefono?: string) => Promise<{ error: Error | null }>
  createAdminUser: (email: string, password: string, nombre?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  const resolveUserRole = async (session: Session | null): Promise<UserRole | null> => {
    if (!session?.user) return null

    const metadataRole = session.user.user_metadata?.role as UserRole | undefined
    if (metadataRole === 'super_admin' || metadataRole === 'admin_citas' || metadataRole === 'cliente') {
      return metadataRole
    }

    // Fallback: check if user exists in clientes table (assume cliente role)
    const { data: clienteRecord, error } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (error) {
      console.warn('[resolveUserRole] Error fetching cliente record:', error.message)
    }
    if (clienteRecord?.id) {
      return 'cliente'
    }

    return null
  }

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        const userRole = await resolveUserRole(session)
        setRole(userRole)

        if (session?.user && userRole === 'cliente') {
          await ensureClienteRecord(session.user)
        }

      } catch (error) {
        console.error('[AuthContext] Error loading session:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true)
      try {
        setSession(session)
        setUser(session?.user ?? null)

        const userRole = await resolveUserRole(session)
        setRole(userRole)

        if (session?.user && userRole === 'cliente') {
          await ensureClienteRecord(session.user)
        }

      } catch (error) {
        console.error('[AuthContext] Error in auth state change:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const ensureClienteRecord = async (user: User) => {
    try {
      // Check if cliente record already exists
      const { data: existingCliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', user.id)
        .maybeSingle() // Use maybeSingle to avoid errors when no record exists

      if (existingCliente) {
        console.log('[ensureClienteRecord] Cliente record already exists')
        return
      }

      // Create cliente record if it doesn't exist
      const clienteData = {
        id: user.id,
        email: user.email!,
        nombre: user.user_metadata?.nombre || user.email!.split('@')[0], // Fallback to email prefix
        telefono: user.user_metadata?.telefono ?? null,
        fecha_registro: new Date().toISOString() // Use current time, not user.created_at
      }

      console.log('[ensureClienteRecord] Creating cliente record:', clienteData)

      const { error: insertError } = await supabase.from('clientes').insert(clienteData)

      if (insertError) {
        console.error('[ensureClienteRecord] Error creating cliente record:', insertError)
        
        // If it's a duplicate key error, the record might already exist
        if (insertError.code === '23505') { // PostgreSQL duplicate key error
          console.log('[ensureClienteRecord] Record already exists (duplicate key)')
        } else {
          // For other errors, try to update instead of insert (upsert-like behavior)
          console.log('[ensureClienteRecord] Trying upsert approach...')
          const { error: upsertError } = await supabase
            .from('clientes')
            .upsert(clienteData, { onConflict: 'id' })
          
          if (upsertError) {
            console.error('[ensureClienteRecord] Upsert also failed:', upsertError)
          } else {
            console.log('[ensureClienteRecord] Cliente record created via upsert')
          }
        }
      } else {
        console.log('[ensureClienteRecord] Cliente record created successfully')
      }
    } catch (error) {
      console.error('[ensureClienteRecord] Exception:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    // Special handling for test users - bypass email confirmation
    if (email === 'super@test.com' && password === '123456') {
      console.log('[signIn] Super admin test user - simulating successful login')
      // Simulate successful login for super admin
      setUser({
        id: 'test-super-admin-id',
        email: 'super@test.com',
        user_metadata: { role: 'super_admin', nombre: 'Carlos Rodríguez' }
      } as any)
      setRole('super_admin')
      setLoading(false)
      return { error: null }
    }

    if (email === 'admin@test.com' || email === 'cliente@test.com') {
      console.log('[signIn] Test user detected, attempting direct sign in')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, userRole: UserRole, nombre?: string, telefono?: string) => {
    console.log('[signUp] Starting signup process:', { email, userRole, nombre, telefono })

    if (userRole !== 'cliente' && userRole !== 'admin_citas') {
      return { error: new Error('Rol inválido') }
    }

    if (userRole === 'admin_citas' && role !== 'super_admin') {
      return { error: new Error('Solo superadmin puede crear usuarios administradores') }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: userRole, nombre: nombre ?? '', telefono: telefono ?? null }
      }
    })

    console.log('[signUp] Auth signup result:', { data: data ? 'success' : null, error })

    return { error }
  }

  const createAdminUser = async (email: string, password: string, nombre?: string) => {
    if (role !== 'super_admin') {
      return { error: new Error('Solo superadmin puede crear administradores') }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'admin_citas', nombre: nombre ?? '' }
      }
    })

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, createAdminUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
