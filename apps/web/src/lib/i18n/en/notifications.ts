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
} satisfies NotificationsDict
