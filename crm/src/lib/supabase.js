import { createClient } from '@supabase/supabase-js'

// These should be set as environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Always log in production to help debug
console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
console.log('Supabase Key:', supabaseAnonKey ? '✓ Set (length: ' + supabaseAnonKey.length + ')' : '✗ Missing')

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'NOT SET')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

