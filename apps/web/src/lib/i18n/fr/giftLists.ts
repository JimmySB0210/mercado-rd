// ============================================================
// MercadoRD — i18n: namespace "giftLists" (français)
// Ruta: src/lib/i18n/fr/giftLists.ts
// ============================================================

import type { GiftListsDict } from '@/lib/i18n/es/giftLists'

export const giftLists = {
  creatorHeading: '🎁 Liste de cadeaux de {alias}',
  locationLine: '📍 {city}',
  priorityHigh: 'Haute',
  priorityMedium: 'Moyenne',
  priorityLow: 'Basse',
  alreadyGiftedBadge: 'Déjà offert 🎁',
  giftThisButton: 'Offrir ceci',
  choosePaymentLabel: 'Comment voulez-vous payer ?',
  paymentAzulLabel: 'Carte (Azul)',
  paymentCardnetLabel: 'Carte (CardNet)',
  paymentTransferLabel: 'Virement',
  paymentCashLabel: 'Espèces',
  givingButton: 'Envoi du cadeau...',
  genericGiftError: "Impossible de traiter le cadeau. Réessayez.",
  cancelButton: 'Annuler',
  emptyListMessage: "Cette liste de cadeaux ne contient encore aucun produit.",
  listUnavailableTitle: "Cette liste n'est plus disponible",
  listUnavailableHint: "Le lien a peut-être expiré ou le créateur l'a désactivée.",

  thankYouTitle: 'Terminé ! Vous avez offert un cadeau à {alias}',
  thankYouHint: 'Le propriétaire de la liste recevra le code de livraison — vous avez fait votre part 🎉',
  backHomeLink: "Retour à l'accueil",
} satisfies GiftListsDict
