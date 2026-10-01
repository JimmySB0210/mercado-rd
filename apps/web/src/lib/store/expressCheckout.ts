'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types'

// ============================================================
// MercadoRD — "Comprar ahora" (checkout de un solo ítem)
// Ruta: src/lib/store/expressCheckout.ts
// ============================================================
// Separado por completo del carrito real (useCartStore) — a propósito.
// "Comprar ahora" nunca debe: (a) sumarse a lo que ya hay en el carrito,
// ni (b) fusionar cantidades si el mismo producto/variante ya estaba
// adentro. Guarda como máximo UN ítem, en sessionStorage (no
// localStorage): sobrevive a un F5 en /checkout?modo=express, pero no
// se arrastra entre sesiones del navegador ni contamina el carrito de
// compras normal, que sigue viviendo intacto en su propio store.
//
// checkout/page.tsx solo lee este ítem cuando la URL trae
// ?modo=express — sin ese flag, el checkout usa el carrito real de
// siempre, sin importar si hay algo acá. Ver comentario en ese archivo.
// ============================================================

interface ExpressCheckoutState {
  item: CartItem | null
  setItem: (item: CartItem) => void
  clearItem: () => void
}

export const useExpressCheckoutStore = create<ExpressCheckoutState>()(
  persist(
    (set) => ({
      item: null,
      setItem: (item) => set({ item }),
      clearItem: () => set({ item: null }),
    }),
    {
      name: 'mercado-rd-express-checkout',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

// La lectura de sessionStorage no es instantánea (persist rehidrata
// después del primer render) — sin esto, checkout leería `item: null`
// por un instante en CADA carga, no solo cuando de verdad no hay ítem
// express, y redirigiría por error incluso en el caso normal de un F5.
// Solo después de que este hook devuelva true es seguro decidir "no hay
// ítem express" de verdad.
//
// OJO: `.persist` nunca se toca fuera de useEffect. Next.js sigue
// pre-renderizando este componente 'use client' en el servidor, donde
// sessionStorage no existe -- si el estado inicial de useState llamara a
// useExpressCheckoutStore.persist.hasHydrated() directamente, esa
// llamada corre también en el render de servidor y tira toda la página
// con un 500 (Cannot read properties of undefined). Dentro de
// useEffect nunca se ejecuta en el servidor, así que es seguro.
export function useExpressCheckoutHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (useExpressCheckoutStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useExpressCheckoutStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  return hydrated
}
