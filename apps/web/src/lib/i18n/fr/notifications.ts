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
  price_drop: {
    title: '🎉 Baisse de prix !',
    body: '{product_name} coûte maintenant RD${new_price_rdp} (au lieu de RD${old_price_rdp}) — vous économisez RD${savings_rdp}',
  },
  back_in_stock: {
    title: '📦 De retour en stock !',
    body: '{product_name}, que vous avez ajouté à vos favoris, est de nouveau disponible — il reste {current_stock} unités.',
  },
} satisfies NotificationsDict
