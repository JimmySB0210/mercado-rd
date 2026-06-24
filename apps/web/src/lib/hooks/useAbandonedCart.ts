'use client'
// ============================================================
// MercadoRD — Tracking de carrito abandonado
// Archivo: lib/hooks/useAbandonedCart.ts
// ============================================================
// Asume que quien lo llama ya verificó que hay sesión activa
// (ver components/shop/AbandonedCartTracker.tsx) — este hook solo
// se ocupa de debounce + llamar al RPC.
// ============================================================

import { useEffect, useRef } from 'react'
import { useCartItems, useCartSubtotal } from '@/lib/store/cart'
import { createClient } from '@/lib/supabase/client'

const DEBOUNCE_MS = 30000

export function useAbandonedCart() {
  const items = useCartItems()
  const subtotal = useCartSubtotal()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (items.length === 0) return

    timerRef.current = setTimeout(() => {
      const supabase = createClient()
      supabase
        .rpc('upsert_abandoned_cart', {
          p_items: JSON.stringify(items),
          p_total_rdp: subtotal,
        })
        .then(({ error }) => {
          if (error) console.error('[useAbandonedCart]', error)
        })
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [items, subtotal])
}
