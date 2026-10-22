// ============================================================
// MercadoRD — Verificar la contraseña actual
// Ruta: src/lib/supabase/verify-current-password.ts
// ============================================================
// Comprueba la contraseña actual con un cliente aparte: no guarda sesión,
// no refresca tokens y no toca cookies ni el cliente principal, así la
// sesión del usuario (y su nivel AAL) queda exactamente como estaba. La
// sesión temporal se revoca después (scope local: solo esa sesión).
//
// El cliente se crea una sola vez y se reutiliza: GoTrue avisa ("Multiple
// GoTrueClient instances") si se crean varias instancias con el mismo
// storageKey en la página. Al no persistir nada y cerrar su sesión tras
// cada comprobación, no conserva estado entre usos.
// ============================================================

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

export type CurrentPasswordCheck = 'ok' | 'incorrect' | 'error'

let verifierClient: SupabaseClient | null = null

function getVerifierClient(): SupabaseClient {
  if (!verifierClient) {
    verifierClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'mercadord-verificar-contrasena', // distinto al del cliente principal
        },
      },
    )
  }
  return verifierClient
}

export async function verifyCurrentPassword(email: string, password: string): Promise<CurrentPasswordCheck> {
  const client = getVerifierClient()
  try {
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) return error.code === 'invalid_credentials' ? 'incorrect' : 'error'
    await client.auth.signOut({ scope: 'local' }).catch(() => {})
    return 'ok'
  } catch {
    return 'error'
  }
}
