// ============================================================
// MercadoRD — i18n: namespace "cart" (English)
// Ruta: src/lib/i18n/en/cart.ts
// ============================================================

import type { CartDict } from '@/lib/i18n/es/cart'

export const cart = {
  cartTitle: 'Your cart ({count})',
  emptyCart: 'Your cart is empty',
  exploreProducts: 'Explore products',
  removeItem: 'Remove',

  orderSummary: 'Order summary',
  subtotalLabel: 'Subtotal ({count} items)',
  freeShippingMissing: 'RD${amount} away from free shipping 🚚',
  freeShippingApplied: 'Free shipping applied! 🎉',
  shippingLabel: 'Shipping',
  freeBadge: 'FREE 🎉',
  itbisLabel: 'ITBIS (18%)',
  totalLabel: 'Total',

  proceedToCheckout: 'Proceed to checkout',
  continueShopping: '← Continue shopping',

  protectedPurchaseTitle: 'Protected purchase',
  protectedPurchaseSub: "If the product doesn't arrive, we'll refund your money",

  paymentTransfer: '🏧 Bank transfer',
  paymentCash: '💵 Cash',
} satisfies CartDict
