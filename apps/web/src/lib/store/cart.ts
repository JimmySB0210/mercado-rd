import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'

const ITBIS_RATE = 0.18 // 18% República Dominicana

// Identifica una línea del carrito: por variantId cuando existe (variante
// real, fija o dinámica), si no por la combinación size+color del sistema
// viejo. Usado por addItem/removeItem/updateQty para no fusionar ni afectar
// por error dos variantes distintas del mismo producto (ambas con
// selected_size/selected_color undefined en el caso dinámico).
function matchesLine(
  item: CartItem,
  productId: string,
  variantId?: string,
  size?: string,
  color?: string
): boolean {
  return (
    item.product.id === productId &&
    (variantId
      ? item.variant_id === variantId
      : item.selected_size === size && item.selected_color === color)
  )
}

interface CartState {
  items: CartItem[]
}

interface CartActions {
  addItem: (product: Product, qty?: number, size?: string, color?: string, variantId?: string, variantPriceRdp?: number, variantLabel?: string) => void
  removeItem: (productId: string, variantId?: string, size?: string, color?: string) => void
  updateQty: (productId: string, qty: number, variantId?: string, size?: string, color?: string) => void
  clearCart: () => void
}

type CartStore = CartState & CartActions

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, qty = 1, size, color, variantId, variantPriceRdp, variantLabel) => {
        set((state) => {
          const exists = state.items.find((i) => matchesLine(i, product.id, variantId, size, color))
          if (exists) {
            return {
              items: state.items.map((i) =>
                matchesLine(i, product.id, variantId, size, color) ? { ...i, quantity: i.quantity + qty } : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              { product, quantity: qty, selected_size: size, selected_color: color, variant_id: variantId, variant_price_rdp: variantPriceRdp, variant_label: variantLabel },
            ],
          }
        })
      },

      removeItem: (productId, variantId, size, color) =>
        set((state) => ({
          items: state.items.filter((i) => !matchesLine(i, productId, variantId, size, color)),
        })),

      updateQty: (productId, qty, variantId, size, color) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => !matchesLine(i, productId, variantId, size, color))
              : state.items.map((i) =>
                  matchesLine(i, productId, variantId, size, color) ? { ...i, quantity: qty } : i
                ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'mercado-rd-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ============================================================
// Valores derivados — calculados FUERA del store como funciones
// puras, en vez de getters de JS dentro del objeto persistido.
// Esto evita el conflicto de nombre con el parámetro `get` de
// Zustand y es más predecible con bundlers/compiladores.
// ============================================================

export function useCartItemCount(): number {
  return useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))
}

export function useCartItems(): CartItem[] {
  return useCartStore((s) => s.items)
}

export function useCartSubtotal(): number {
  return useCartStore((s) =>
    s.items.reduce((acc, i) => acc + (i.variant_price_rdp ?? i.product.price_rdp) * i.quantity, 0)
  )
}

export function useCartItbis(): number {
  const subtotal = useCartSubtotal()
  return Math.round(subtotal * ITBIS_RATE)
}

export function useCartTotal(): number {
  const subtotal = useCartSubtotal()
  const itbis = useCartItbis()
  return subtotal + itbis
}

// ─── Formatear precio en pesos dominicanos ────────────────────
export function formatRDP(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(amount)
}
