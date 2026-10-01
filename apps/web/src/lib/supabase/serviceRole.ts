import { createClient } from '@supabase/supabase-js'

// ============================================================
// MercadoRD — Cliente Supabase con service role (SOLO servidor)
// Ruta: src/lib/supabase/serviceRole.ts
// ============================================================
// SUPABASE_SERVICE_ROLE_KEY (sin prefijo NEXT_PUBLIC_) ya queda fuera
// del bundle del navegador por convención de Next.js — igual: este
// archivo se importa SOLO desde código que corre en el servidor (API
// routes), nunca desde un componente de cliente.
//
// A diferencia de createServerClient() (lib/supabase/server.ts), este
// cliente NO lleva las cookies de sesión de quien hizo la request: no
// actúa "como" el visitante que llamó a la ruta, actúa como el propio
// backend, sin RLS. Usar SOLO para operaciones donde la identidad de
// quien disparó la request no debe importar (ej. escribir una
// traducción cacheada de producto, que es la misma para cualquiera
// que la pida) — nunca para nada que dependa de auth.uid() del
// visitante, porque acá no hay ningún visitante autenticado, es el
// backend mismo.
// ============================================================

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!url || !serviceRoleKey) {
    throw new Error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
