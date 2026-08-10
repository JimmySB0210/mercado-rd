// ============================================================
// MercadoRD — i18n: namespace "chat" (English)
// Ruta: src/lib/i18n/en/chat.ts
// ============================================================

import type { ChatDict } from '@/lib/i18n/es/chat'

export const chat = {
  loadingConversations: 'Loading conversations...',
  loadingChat: 'Loading chat...',
  defaultVendorName: 'Vendor',
  defaultBuyerName: 'Buyer',
  sendButton: 'Send',
  messagePlaceholder: 'Write a message...',

  messagesPageTitle: 'Messages',
  messagesPageSubtitle: 'Your conversations with stores',
  asBuyerSectionTitle: 'As a buyer',
  asVendorSectionTitle: 'As a vendor',
  emptyAsBuyer: "You don't have any messages as a buyer yet",
  emptyAsVendor: "You don't have any messages as a vendor yet",
  emptyGeneric: "You don't have any messages yet",
  noMessagesInConvoShort: 'No messages yet',
  justNow: 'just now',
  minutesAgo: '{count} min ago',
  hoursAgo: '{count}h ago',
  daysAgo: '{count}d ago',

  backToMessagesLink: 'Back to messages',
  conversationNotFound: 'This conversation could not be found.',
  noMessagesInThread: 'There are no messages in this conversation yet.',
  verifiedTrustBadge: '✓ Verified',
  newOnMercadoRD: 'New on MercadoRD',
  onMercadoRDSince: 'On MercadoRD {duration}',
  membershipMonthsSingular: '{count} month ago',
  membershipMonthsPlural: '{count} months ago',
  membershipYearsSingular: '{count} year ago',
  membershipYearsPlural: '{count} years ago',
} satisfies ChatDict
