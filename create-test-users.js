import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfkplmrvqqpvtiwfakyx.supabase.co'
// You'll need to replace this with your actual service role key from Supabase Dashboard
const supabaseServiceKey = 'your_service_role_key_here'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function confirmUserEmails() {
  console.log('Confirming user emails...')

  const emails = ['cliente@test.com', 'admin@test.com', 'super@test.com']

  for (const email of emails) {
    try {
      console.log(`Confirming email for: ${email}`)

      // Get user by email
      const { data: users, error: getError } = await supabase.auth.admin.listUsers()

      if (getError) {
        console.error(`Error getting users:`, getError.message)
        continue
      }

      const user = users.users.find(u => u.email === email)
      if (!user) {
        console.error(`User ${email} not found`)
        continue
      }

      // Update user to confirm email
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      })

      if (updateError) {
        console.error(`Error confirming ${email}:`, updateError.message)
      } else {
        console.log(`✅ Confirmed email for ${email}`)
      }

    } catch (error) {
      console.error(`Unexpected error confirming ${email}:`, error)
    }
  }

  console.log('Email confirmation completed!')
}

// Run the script
confirmUserEmails().catch(console.error)