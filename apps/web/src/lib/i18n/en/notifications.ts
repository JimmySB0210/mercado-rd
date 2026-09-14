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
} satisfies NotificationsDict
