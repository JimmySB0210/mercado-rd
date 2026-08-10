// ============================================================
// MercadoRD — i18n: namespace "cart" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/cart.ts
// ============================================================
// Texto de app/cart/page.tsx. Claves con {variable} soportan
// interpolación vía t(key, params) — ver lib/hooks/useTranslation.ts.
// ============================================================

export const cart = {
  cartTitle: 'Tu carrito ({count})',
  emptyCart: 'Tu carrito está vacío',
  exploreProducts: 'Explorar productos',
  removeItem: 'Eliminar',

  orderSummary: 'Resumen del pedido',
  subtotalLabel: 'Subtotal ({count} artículos)',
  freeShippingMissing: 'Te faltan RD${amount} para envío gratis 🚚',
  freeShippingApplied: '¡Envío gratis aplicado! 🎉',
  shippingLabel: 'Envío',
  freeBadge: 'GRATIS 🎉',
  itbisLabel: 'ITBIS (18%)',
  totalLabel: 'Total',

  proceedToCheckout: 'Proceder al pago',
  continueShopping: '← Seguir comprando',

  protectedPurchaseTitle: 'Compra protegida',
  protectedPurchaseSub: 'Si el producto no llega te devolvemos tu dinero',

  paymentTransfer: '🏧 Transferencia',
  paymentCash: '💵 Efectivo',
}

export type CartDict = typeof cart
