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
  review_received: {
    title: 'New review received ⭐',
    body: 'You received a {rating}-star review on "{product_name}".',
  },
  gift_purchased: {
    title: '🎁 Someone bought you a gift!',
    body: '{buyer_name} bought you "{product_name}" from your gift list.',
  },
  verification_update: {
    title: 'Your verification level changed!',
    body: 'Your store now has the status: {level_label}',
  },
  dispute_opened: {
    title: 'New dispute opened ⚠️',
    body: 'A buyer opened a dispute on order {order_short_id}. Review the details.',
    titleAdmin: 'New dispute to review ⚠️',
    bodyAdmin: 'A dispute was opened on order {order_short_id}. It needs your attention.',
  },
  delivery_otp: {
    title: '🔐 Your delivery code',
    titleGift: '🎁 You have a gift on the way!',
    body: 'Your code to confirm delivery is: {otp_code}. Share it with the courier ONLY once you have the product in hand.',
    giftPrefix: 'You have a gift on the way! ',
    recipientSuffix: ' Remember to share this code with {recipient_name}, who will receive the order.',
  },
} satisfies NotificationsDict
