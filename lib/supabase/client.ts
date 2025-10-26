import { createBrowserClient } from "@supabase/ssr"
import { supabaseConfig } from "./config"

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('createClient should only be used in the browser')
  }
  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey)
}
