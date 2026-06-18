import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'

const ITBIS_RATE = 0.18 // 18% República Dominicana

interface CartState {
  items: CartItem[]
}

interface CartActions {
  addItem: (product: Product, qty?: number, size?: string, color?: string) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
}

type CartStore = CartState & CartActions

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, qty = 1, size, color) => {
        set((state) => {
          const exists = state.items.find(
            (i) =>
              i.product.id === product.id &&
              i.selected_size === size &&
              i.selected_color === color
          )
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id &&
                i.selected_size === size &&
                i.selected_color === color
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              { product, quantity: qty, selected_size: size, selected_color: color },
            ],
          }
        })
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),

      updateQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.product.id !== productId)
              : state.items.map((i) =>
                  i.product.id === productId ? { ...i, quantity: qty } : i
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

export function useCartSubtotal(): number {
  return useCartStore((s) =>
    s.items.reduce((acc, i) => acc + i.product.price_rdp * i.quantity, 0)
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
