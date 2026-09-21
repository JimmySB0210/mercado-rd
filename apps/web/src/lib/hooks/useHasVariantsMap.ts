'use client'
// ============================================================
// MercadoRD — Detección batched de "este producto tiene variantes"
// Ruta: src/lib/hooks/useHasVariantsMap.ts
// ============================================================
// ProductCard solo puede ofrecer "Agregar al carrito" directo cuando NO
// hace falta elegir talla/color — y el único indicador confiable de eso
// es si el producto tiene filas activas en product_variants (el sistema
// nuevo de variantes dinámicas; sizes/colors planos en products ya se
// revisan aparte, dentro de ProductCard). Consultar product_variants
// producto por producto sería N+1 sobre una grilla de docenas de
// tarjetas — este hook hace consultas batched, una por cada tanda de
// productos nuevos.
//
// Devuelve un Map id → boolean con lo que YA se verificó. Un id que no
// está en el Map es "todavía no verificado" (map.get(id) === undefined):
// ProductCard lo trata como "verificando" — nunca ofrece agregar directo,
// nunca puede arriesgarse a una línea de carrito sin variante elegida.
//
// La verificación es por producto y se acumula: si la lista crece o
// cambia (HomeProductGrid "Ver más", NearbyProducts al cambiar de
// provincia, "Ver más resultados" en búsqueda) los ids ya verificados
// conservan su valor — no parpadean — y solo los ids nuevos arrancan en
// "verificando" y se consultan. Antes el hook devolvía un único Set que
// seguía valiendo mientras llegaba la respuesta de la lista nueva, así
// que los productos recién agregados se leían como "sin variantes" (y
// una lista que arrancaba vacía devolvía de inmediato un Set vacío que
// decía lo mismo de TODOS) hasta que respondía la consulta.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public'

export function useHasVariantsMap(productIds: string[]): ReadonlyMap<string, boolean> {
  const [verified, setVerified] = useState<ReadonlyMap<string, boolean>>(() => new Map())
  // ids que ya se pidieron (verificados o con la consulta en vuelo) —
  // evita repetir una consulta cuando cambia la lista mientras otra
  // sigue pendiente, y que el doble efecto de StrictMode consulte dos veces
  const requested = useRef<Set<string>>(new Set())
  const mounted = useRef(false)
  const key = productIds.join(',')

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    const pending = Array.from(new Set(productIds.filter(id => !requested.current.has(id))))
    if (pending.length === 0) return
    pending.forEach(id => requested.current.add(id))

    createPublicClient()
      .from('product_variants')
      .select('product_id')
      .eq('is_active', true)
      .in('product_id', pending)
      .then(({ data, error }) => {
        if (!mounted.current) return
        if (error) console.error('[useHasVariantsMap]', error)
        const withVariants = new Set((data ?? []).map(r => r.product_id))
        setVerified(prev => {
          const next = new Map(prev)
          // Si la consulta falla no se sabe la respuesta: se asume "con
          // variantes" (→ "Ver opciones", que lleva a la página donde sí
          // se elige) y no "sin variantes" (→ agregar directo). Una red
          // caída tarda unos segundos en llegar acá (supabase-js reintenta
          // antes de rendirse); mientras tanto la tarjeta sigue en
          // "verificando", que también es un estado seguro.
          for (const id of pending) next.set(id, error ? true : withVariants.has(id))
          return next
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return verified
}
