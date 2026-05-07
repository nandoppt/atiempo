import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfkplmrvqqpvtiwfakyx.supabase.co'
const supabaseAnonKey = 'sb_publishable_ofDFSdE9X8rSuIKCMhB9-Q_GSIpFM3B'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixDataConsistency() {
  console.log('Fixing data consistency...')

  try {
    // Sign in first
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: '123456'
    })

    if (authError) {
      console.error('Auth error:', authError.message)
      return
    }

    console.log('✅ Signed in successfully')

    // First, create the missing cliente record for cliente@test.com
    console.log('Creating missing cliente record...')
    const { error: clienteError } = await supabase
      .from('clientes')
      .insert({
        id: 'bb7d6233-0909-44cd-977f-7368ff785a15', // cliente@test.com
        email: 'cliente@test.com',
        nombre: 'Juan Pérez',
        telefono: '+56912345678',
        fecha_registro: new Date().toISOString()
      })

    if (clienteError) {
      console.error('Error creating cliente:', clienteError.message)
    } else {
      console.log('✅ Created cliente: cliente@test.com')
    }

    // Update the citas to be associated with the admin user (admin@test.com)
    console.log('Updating citas to be associated with admin user...')
    const { error: updateError } = await supabase
      .from('citas')
      .update({ cliente_id: 'bc81cacb-5664-4004-af84-4a0bb1f693eb' })
      .neq('cliente_id', 'bc81cacb-5664-4004-af84-4a0bb1f693eb') // Update all citas that aren't already associated with admin

    if (updateError) {
      console.error('Error updating citas:', updateError.message)
    } else {
      console.log('✅ Updated citas to be associated with admin user')
    }

    // Create some additional citas for the cliente@test.com user
    console.log('Creating additional citas for cliente user...')
    const newCitas = [
      {
        cliente_id: 'bb7d6233-0909-44cd-977f-7368ff785a15',
        servicio_id: '92e6bfbb-501c-4de3-bde4-3a8b2992221f',
        fecha_hora_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        estado: 'confirmada',
        fecha_creacion: new Date().toISOString(),
        notas: 'Consulta general programada'
      },
      {
        cliente_id: 'bb7d6233-0909-44cd-977f-7368ff785a15',
        servicio_id: '7431beac-4275-47da-bb27-501d9941ca01',
        fecha_hora_inicio: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        estado: 'pendiente',
        fecha_creacion: new Date().toISOString(),
        notas: 'Seguimiento de tratamiento'
      }
    ]

    for (const cita of newCitas) {
      const { error } = await supabase
        .from('citas')
        .insert(cita)

      if (error) {
        console.error('Error creating cita:', error.message)
      } else {
        console.log('✅ Created additional cita')
      }
    }

    console.log('Data consistency fix completed!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the fix
fixDataConsistency().catch(console.error)