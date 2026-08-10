// ============================================================
// MercadoRD — i18n: namespace "chat" (français)
// Ruta: src/lib/i18n/fr/chat.ts
// ============================================================

import type { ChatDict } from '@/lib/i18n/es/chat'

export const chat = {
  loadingConversations: 'Chargement des conversations...',
  loadingChat: 'Chargement du chat...',
  defaultVendorName: 'Vendeur',
  defaultBuyerName: 'Acheteur',
  sendButton: 'Envoyer',
  messagePlaceholder: 'Écrivez un message...',

  messagesPageTitle: 'Messages',
  messagesPageSubtitle: 'Vos conversations avec les boutiques',
  asBuyerSectionTitle: "En tant qu'acheteur",
  asVendorSectionTitle: 'En tant que vendeur',
  emptyAsBuyer: "Vous n'avez encore aucun message en tant qu'acheteur",
  emptyAsVendor: "Vous n'avez encore aucun message en tant que vendeur",
  emptyGeneric: "Vous n'avez encore aucun message",
  noMessagesInConvoShort: 'Pas encore de messages',
  justNow: "à l'instant",
  minutesAgo: 'il y a {count} min',
  hoursAgo: 'il y a {count}h',
  daysAgo: 'il y a {count}j',

  backToMessagesLink: 'Retour aux messages',
  conversationNotFound: 'Cette conversation est introuvable.',
  noMessagesInThread: "Il n'y a pas encore de messages dans cette conversation.",
  verifiedTrustBadge: '✓ Vérifié',
  newOnMercadoRD: 'Nouveau sur MercadoRD',
  onMercadoRDSince: 'Sur MercadoRD {duration}',
  membershipMonthsSingular: 'il y a {count} mois',
  membershipMonthsPlural: 'il y a {count} mois',
  membershipYearsSingular: 'il y a {count} an',
  membershipYearsPlural: 'il y a {count} ans',
} satisfies ChatDict
