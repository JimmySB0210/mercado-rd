import { createClient } from '@supabase/supabase-js'

// Cliente anónimo sin cookies — para datos públicos cacheables con ISR
// No usar para datos que requieren autenticación
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
