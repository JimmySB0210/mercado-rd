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
} satisfies NotificationsDict
