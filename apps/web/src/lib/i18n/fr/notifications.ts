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
  order_confirmed: {
    title: 'Commande confirmée ! 🎉',
    body: 'Votre commande {order_short_id} a été confirmée et est en préparation.',
  },
  order_shipped: {
    title: 'Votre commande est en route 🚚',
    body: 'Votre commande {order_short_id} a été expédiée et arrivera bientôt.',
  },
  order_delivered: {
    title: 'Commande livrée ! ✅',
    body: 'Votre commande {order_short_id} a été livrée. Tout va bien ? Laissez un avis.',
  },
  new_order: {
    title: 'Nouvelle commande reçue ! 🛒',
    body: 'Vous avez une nouvelle commande {order_short_id} en attente de confirmation.',
  },
  quote_requested: {
    title: 'Nouvelle demande de devis 💰',
    body: 'On vous a demandé un devis pour {quantity} unités',
  },
  quote_responded: {
    title: '{vendor_business_name} vous a envoyé un prix 💰',
    body: 'Nouveau prix : RD${price_rdp} par unité',
  },
  quote_accepted: {
    title: 'Devis accepté ! 🎉',
    body: "L'acheteur a accepté votre prix et a passé une commande",
  },
  new_message: {
    title: "Nouveau message d'un acheteur 💬",
    titleFromVendor: '{vendor_business_name} vous a répondu 💬',
    body: '{message_preview}',
  },
  review_received: {
    title: 'Nouvel avis reçu ⭐',
    body: 'Vous avez reçu un avis {rating} étoiles sur « {product_name} ».',
  },
  gift_purchased: {
    title: "🎁 Quelqu'un vous a acheté un cadeau !",
    body: '{buyer_name} vous a acheté « {product_name} » de votre liste de cadeaux.',
  },
  verification_update: {
    title: 'Votre niveau de vérification a changé !',
    body: 'Votre boutique a maintenant le statut : {level_label}',
  },
  dispute_opened: {
    title: 'Nouveau litige ouvert ⚠️',
    body: 'Un acheteur a ouvert un litige sur la commande {order_short_id}. Consultez les détails.',
    titleAdmin: 'Nouveau litige à examiner ⚠️',
    bodyAdmin: 'Un litige a été ouvert sur la commande {order_short_id}. Il nécessite votre attention.',
  },
  delivery_otp: {
    title: '🔐 Votre code de livraison',
    titleGift: '🎁 Un cadeau est en route pour vous !',
    body: 'Votre code pour confirmer la livraison est : {otp_code}. Partagez-le avec le livreur SEULEMENT une fois le produit en main.',
    giftPrefix: 'Un cadeau est en route pour vous ! ',
    recipientSuffix: " N'oubliez pas de partager ce code avec {recipient_name}, qui recevra la commande.",
  },
} satisfies NotificationsDict
