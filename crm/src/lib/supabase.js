import { createClient } from '@supabase/supabase-js'

// These should be set as environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Always log in production to help debug
console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
console.log('Supabase Key:', supabaseAnonKey ? '✓ Set (length: ' + supabaseAnonKey.length + ')' : '✗ Missing')

// Only create client if credentials are available, otherwise create a mock client
let supabase

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    supabase = null
  }
} else {
  console.warn('Supabase not configured - some features may not work')
  // Create a mock client that won't crash but will return errors when used
  supabase = {
    from: () => ({
      select: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => ({ eq: () => ({ data: null, error: { message: 'Supabase not configured' } }) }),
      delete: () => ({ eq: () => ({ data: null, error: { message: 'Supabase not configured' } }) }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
    removeChannel: () => {},
  }
}

export { supabase }

