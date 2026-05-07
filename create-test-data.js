import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfkplmrvqqpvtiwfakyx.supabase.co'
const supabaseAnonKey = 'sb_publishable_ofDFSdE9X8rSuIKCMhB9-Q_GSIpFM3B'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestData() {
  console.log('Creating test data...')

  try {
    // First, sign in with admin user to bypass RLS
    console.log('Signing in with admin user...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: '123456'
    })

    if (authError) {
      console.error('Auth error:', authError.message)
      return
    }

    console.log('✅ Signed in successfully')

    // Wait a bit for session to be established
    await new Promise(resolve => setTimeout(resolve, 1000))
    // First, ensure cliente records exist for our test users
    console.log('Creating cliente records...')

    const clientesData = [
      {
        id: 'bb7d6233-0909-44cd-977f-7368ff785a15', // cliente@test.com
        email: 'cliente@test.com',
        nombre: 'Juan Pérez',
        telefono: '+56912345678',
        fecha_registro: new Date().toISOString()
      },
      {
        id: 'bc81cacb-5664-4004-af84-4a0bb1f693eb', // admin@test.com
        email: 'admin@test.com',
        nombre: 'María García',
        telefono: '+56987654321',
        fecha_registro: new Date().toISOString()
      }
    ]

    for (const cliente of clientesData) {
      const { error } = await supabase
        .from('clientes')
        .upsert(cliente, { onConflict: 'id' })

      if (error) {
        console.error(`Error creating cliente ${cliente.email}:`, error.message)
      } else {
        console.log(`✅ Created cliente: ${cliente.email}`)
      }
    }

    // Create some test appointments
    console.log('Creating test appointments...')

    const citasData = [
      {
        cliente_id: 'bb7d6233-0909-44cd-977f-7368ff785a15',
        servicio_id: null, // Will create services first
        fecha_hora_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        estado: 'confirmada',
        fecha_creacion: new Date().toISOString(),
        notas: 'Consulta general programada'
      },
      {
        cliente_id: 'bb7d6233-0909-44cd-977f-7368ff785a15',
        servicio_id: null,
        fecha_hora_inicio: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        estado: 'pendiente',
        fecha_creacion: new Date().toISOString(),
        notas: 'Seguimiento de tratamiento'
      },
      {
        cliente_id: 'bb7d6233-0909-44cd-977f-7368ff785a15',
        servicio_id: null,
        fecha_hora_inicio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estado: 'pendiente',
        fecha_creacion: new Date().toISOString(),
        notas: 'Consulta especializada'
      }
    ]

    for (const cita of citasData) {
      const { error } = await supabase
        .from('citas')
        .insert(cita)

      if (error) {
        console.error('Error creating cita:', error.message)
      } else {
        console.log('✅ Created cita')
      }
    }

    // Create a test service
    console.log('Creating test service...')
    const { error: serviceError } = await supabase
      .from('servicios')
      .insert({
        nombre: 'Consulta General',
        duracion_minutos: 30,
        activo: true
      })

    if (serviceError) {
      console.error('Error creating service:', serviceError.message)
    } else {
      console.log('✅ Created service')
    }

    console.log('Test data creation completed!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the script
createTestData().catch(console.error)