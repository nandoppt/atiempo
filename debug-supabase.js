import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase env variables')
  process.exit(1)
}

const supabase = createClient(url, key)

const main = async () => {
  const { data, error } = await supabase
    .from('citas')
    .select('id, estado, fecha_hora_inicio, fecha_creacion, cliente_id, servicio_id, clientes(id,nombre,email), servicios(id,nombre)')
    .eq('estado', 'pendiente')
    .limit(20)

  console.log('error:', error)
  console.log('count:', data?.length)
  console.log('data sample:', JSON.stringify(data?.slice(0, 5), null, 2))
}

main().catch(err => {
  console.error('unexpected error', err)
  process.exit(1)
})
