// ============================================================
// MercadoRD — i18n: namespace "notifications" (English)
// Ruta: src/lib/i18n/en/notifications.ts
// ============================================================

import type { NotificationsDict } from '@/lib/i18n/es/notifications'

export const notifications = {
  low_stock: {
    title: '⚠️ Low stock',
    body: '{product_name} has only {current_stock} units left (your alert was set at {threshold}).',
  },
  price_drop: {
    title: '🎉 Price drop!',
    body: '{product_name} now costs RD${new_price_rdp} (was RD${old_price_rdp}) — you save RD${savings_rdp}',
  },
  back_in_stock: {
    title: '📦 Back in stock!',
    body: '{product_name}, which you saved to your favorites, is back in stock — {current_stock} units left.',
  },
  order_confirmed: {
    title: 'Order confirmed! 🎉',
    body: 'Your order {order_short_id} was confirmed and is being prepared.',
  },
  order_shipped: {
    title: 'Your order is on its way 🚚',
    body: 'Your order {order_short_id} has shipped and will arrive soon.',
  },
  order_delivered: {
    title: 'Order delivered! ✅',
    body: 'Your order {order_short_id} was delivered. Everything good? Leave a review.',
  },
  new_order: {
    title: 'New order received! 🛒',
    body: 'You have a new order {order_short_id} waiting for confirmation.',
  },
  quote_requested: {
    title: 'New quote request 💰',
    body: 'You were asked to quote {quantity} units',
  },
  quote_responded: {
    title: '{vendor_business_name} sent you a price 💰',
    body: 'New price: RD${price_rdp} per unit',
  },
  quote_accepted: {
    title: 'Quote accepted! 🎉',
    body: 'The buyer accepted your price and placed an order',
  },
  new_message: {
    title: 'New message from a buyer 💬',
    titleFromVendor: '{vendor_business_name} replied 💬',
    body: '{message_preview}',
  },
} satisfies NotificationsDict
