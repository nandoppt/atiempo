import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfkplmrvqqpvtiwfakyx.supabase.co'
const supabaseAnonKey = 'sb_publishable_ofDFSdE9X8rSuIKCMhB9-Q_GSIpFM3B'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkExistingData() {
  console.log('Checking existing data...')

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

    // Check existing data
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')

    if (clientesError) {
      console.error('Error fetching clientes:', clientesError.message)
    } else {
      console.log(`Found ${clientes?.length || 0} clientes:`, clientes)
    }

    const { data: citas, error: citasError } = await supabase
      .from('citas')
      .select('*')

    if (citasError) {
      console.error('Error fetching citas:', citasError.message)
    } else {
      console.log(`Found ${citas?.length || 0} citas:`, citas)
    }

    const { data: servicios, error: serviciosError } = await supabase
      .from('servicios')
      .select('*')

    if (serviciosError) {
      console.error('Error fetching servicios:', serviciosError.message)
    } else {
      console.log(`Found ${servicios?.length || 0} servicios:`, servicios)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the check
checkExistingData().catch(console.error)