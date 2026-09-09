// ============================================================
// MercadoRD — i18n: namespace "giftLists" (English)
// Ruta: src/lib/i18n/en/giftLists.ts
// ============================================================

import type { GiftListsDict } from '@/lib/i18n/es/giftLists'

export const giftLists = {
  creatorHeading: "🎁 {alias}'s gift list",
  locationLine: '📍 {city}',
  priorityHigh: 'High',
  priorityMedium: 'Medium',
  priorityLow: 'Low',
  alreadyGiftedBadge: 'Already gifted 🎁',
  giftThisButton: 'Gift this',
  choosePaymentLabel: 'How do you want to pay?',
  paymentAzulLabel: 'Card (Azul)',
  paymentCardnetLabel: 'Card (CardNet)',
  paymentTransferLabel: 'Bank transfer',
  paymentCashLabel: 'Cash',
  givingButton: 'Sending gift...',
  genericGiftError: "We couldn't process the gift. Please try again.",
  cancelButton: 'Cancel',
  emptyListMessage: "This gift list doesn't have any products yet.",
  listUnavailableTitle: 'This list is no longer available',
  listUnavailableHint: 'The link may have expired or the creator deactivated it.',

  thankYouTitle: "You're done! You bought a gift for {alias}",
  thankYouHint: "The list owner will receive the delivery code — you've done your part 🎉",
  backHomeLink: 'Back to home',
} satisfies GiftListsDict
