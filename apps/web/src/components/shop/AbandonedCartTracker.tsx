'use client'
// ============================================================
// MercadoRD — Tracker de carrito abandonado (invisible)
// Ruta: src/components/shop/AbandonedCartTracker.tsx
// ============================================================
// Componente intermedio porque los hooks no pueden llamarse
// condicionalmente — Tracker solo se monta (y por lo tanto solo
// llama useAbandonedCart) cuando ya se confirmó sesión activa.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAbandonedCart } from '@/lib/hooks/useAbandonedCart'

function Tracker() {
  useAbandonedCart()
  return null
}

export function AbandonedCartTracker() {
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthenticated(!!user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!authenticated) return null
  return <Tracker />
}
