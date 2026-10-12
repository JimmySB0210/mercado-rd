'use client'
// ============================================================
// MercadoRD — Id de la tienda del usuario actual
// Ruta: src/lib/hooks/useOwnVendorId.ts
// ============================================================
// Para ocultar "Chatear" en la tienda propia comparando ids de tienda,
// sin pasar user_id a los datos públicos de la tienda. Una sola
// consulta por página, no una por tarjeta.
//   undefined = todavía cargando · null = sin sesión o sin tienda
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useOwnVendorId(): string | null | undefined {
  const [ownVendorId, setOwnVendorId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        if (!cancelled) setOwnVendorId(null)
        return
      }
      const { data } = await supabase.from('vendors').select('id').eq('user_id', user.id).maybeSingle()
      if (!cancelled) setOwnVendorId(data?.id ?? null)
    })
    return () => { cancelled = true }
  }, [])

  return ownVendorId
}
