import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'

export function createAuthClient(useServiceRole = false) {
  if (typeof window === 'undefined' && !useServiceRole) {
    throw new Error('createAuthClient without service role should only be used in the browser')
  }

  const supabaseKey = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : supabaseConfig.anonKey

  return createSupabaseClient(supabaseConfig.url, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'supabase.auth.token',
      detectSessionInUrl: true,
    },
  })
}