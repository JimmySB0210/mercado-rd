// ============================================================
// MercadoRD — i18n: namespace "notifications" (français)
// Ruta: src/lib/i18n/fr/notifications.ts
// ============================================================

import type { NotificationsDict } from '@/lib/i18n/es/notifications'

export const notifications = {
  low_stock: {
    title: '⚠️ Stock faible',
    body: 'Il ne reste que {current_stock} unités de {product_name} (votre alerte était réglée à {threshold}).',
  },
} satisfies NotificationsDict
