import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

const ITBIS_RATE = 0.18; // 18% República Dominicana

interface CartStore {
  items:        CartItem[];
  addItem:      (product: Product, qty?: number, size?: string, color?: string) => void;
  removeItem:   (productId: string) => void;
  updateQty:    (productId: string, qty: number) => void;
  clearCart:    () => void;
  // Computed
  itemCount:    number;
  subtotal:     number;
  itbis:        number;
  total:        number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty = 1, size, color) => {
        set((state) => {
          const exists = state.items.find(
            (i) => i.product.id === product.id &&
                   i.selected_size === size &&
                   i.selected_color === color
          );
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { product, quantity: qty, selected_size: size, selected_color: color },
            ],
          };
        });
      },

      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),

      updateQty: (productId, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.product.id !== productId)
            : s.items.map((i) =>
                i.product.id === productId ? { ...i, quantity: qty } : i
              ),
        })),

      clearCart: () => set({ items: [] }),

      // Getters como propiedades computadas
      get itemCount() {
        return get().items.reduce((acc, i) => acc + i.quantity, 0);
      },
      get subtotal() {
        return get().items.reduce(
          (acc, i) => acc + i.product.price_rdp * i.quantity, 0
        );
      },
      get itbis() {
        return Math.round(get().subtotal * ITBIS_RATE);
      },
      get total() {
        return get().subtotal + get().itbis;
      },
    }),
    {
      name:    'mercado-rd-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ─── Formatear precio en pesos dominicanos ────────────────────────────────────
export function formatRDP(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style:    'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(amount);
}
