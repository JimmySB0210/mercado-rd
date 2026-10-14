'use client'
// ============================================================
// MercadoRD — Cotización del carrito en el servidor (quote_cart)
// Ruta: src/lib/cart/quote.ts
// ============================================================
// quote_cart es de solo lectura y aplica la misma regla que
// create_order_from_cart: precio por tramo > precio de variante > precio
// base, ITBIS sobre el subtotal y envío gratis desde el umbral. Carrito y
// checkout muestran esto en vez de calcular localmente. total_rdp no
// incluye cupón: lo que se cobra es total_rdp − descuento.
// Montos en centavos, como el resto del front.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CartItem } from '@/types'

export type QuoteLineStatus = 'ok' | 'invalid_item' | 'invalid_quantity' | 'product_unavailable' | 'variant_unavailable'

export interface QuoteLine {
  index: number
  product_id: string
  variant_id: string | null
  quantity: number
  status: QuoteLineStatus
  unit_price_rdp: number | null
  line_total_rdp: number | null
  price_source: 'tier' | 'variant' | 'base' | null
  available_quantity: number | null
}

export interface CartQuote {
  lines: QuoteLine[]
  all_available: boolean
  subtotal_rdp: number
  itbis_rdp: number
  delivery_rdp: number | null
  qualifies_free_shipping: boolean
  free_shipping_threshold_rdp: number
  total_rdp: number
}

export interface QuoteItem {
  product_id: string
  variant_id: string | null
  quantity: number
}

export function buildQuoteItems(items: CartItem[]): QuoteItem[] {
  return items.map(i => ({ product_id: i.product.id, variant_id: i.variant_id ?? null, quantity: i.quantity }))
}

// Línea que no se puede comprar: no disponible o sin stock suficiente.
// quote_cart devuelve status 'ok' aunque la cantidad supere el stock, así
// que esa comparación se hace aquí.
export function lineProblem(line: QuoteLine | undefined): 'unavailable' | 'stock' | null {
  if (!line) return null
  if (line.status !== 'ok') return 'unavailable'
  if (line.available_quantity !== null && line.quantity > line.available_quantity) return 'stock'
  return null
}

export function quoteBlocksPurchase(quote: CartQuote): boolean {
  return !quote.all_available || quote.lines.some(l => lineProblem(l) !== null)
}

// Llamada directa (sin debounce), para la cotización fresca antes de cobrar.
export async function fetchCartQuote(items: CartItem[], provinceId: number | null): Promise<CartQuote> {
  const { data, error } = await createClient().rpc('quote_cart', {
    p_items: buildQuoteItems(items),
    p_province_id: provinceId,
  })
  if (error || !data) throw error ?? new Error('quote_cart sin datos')
  return data as CartQuote
}

export type CartQuoteStatus = 'idle' | 'loading' | 'ready' | 'error'

// quote.lines[i] corresponde a items[i] (por index). Sin ítems no llama.
// Debounce de ~300 ms; si llegan respuestas fuera de orden, solo cuenta
// la de la última petición. reload() fuerza una nueva cotización.
export function useCartQuote(items: CartItem[], provinceId: number | null) {
  const [quote, setQuote] = useState<CartQuote | null>(null)
  const [status, setStatus] = useState<CartQuoteStatus>('idle')
  const [reloadKey, setReloadKey] = useState(0)
  const requestRef = useRef(0)

  // Clave estable del contenido que afecta a la cotización.
  const key = JSON.stringify([buildQuoteItems(items), provinceId])

  useEffect(() => {
    const requestId = ++requestRef.current
    if (items.length === 0) {
      setQuote(null)
      setStatus('idle')
      return
    }
    setStatus('loading')
    const timer = setTimeout(() => {
      fetchCartQuote(items, provinceId)
        .then(result => {
          if (requestId !== requestRef.current) return
          setQuote(result)
          setStatus('ready')
        })
        .catch(err => {
          if (requestId !== requestRef.current) return
          console.error('[useCartQuote]', err)
          setStatus('error')
        })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadKey])

  return { quote, status, reload: () => setReloadKey(k => k + 1), setQuote }
}
