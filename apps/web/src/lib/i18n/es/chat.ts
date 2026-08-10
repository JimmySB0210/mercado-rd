// ============================================================
// MercadoRD — i18n: namespace "chat" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/chat.ts
// ============================================================
// Cubre app/mensajes/page.tsx y app/mensajes/[id]/page.tsx.
//
// app/dashboard/mensajes/page.tsx (inbox del vendor) ya está resuelto
// por completo vía el namespace "dashboard" (MensajesContent.tsx) —
// no se duplica aquí. components/product/ContactVendorButton.tsx ya
// está resuelto vía el namespace "products" — tampoco se duplica.
//
// La duración de membresía ("Nuevo en MercadoRD" / "En MercadoRD hace
// X") se recalcula localmente en app/mensajes/[id]/page.tsx, traducida,
// en vez de usar getMembershipDuration() de lib/utils.ts — esa función
// también la usa app/tienda/[id] (ya resuelto vía "directory") y no se
// toca, mismo patrón ya aplicado ahí.
// ============================================================

export const chat = {
  // Genérico (reutilizado en ambos archivos)
  loadingConversations: 'Cargando conversaciones...',
  loadingChat: 'Cargando chat...',
  defaultVendorName: 'Vendedor',
  defaultBuyerName: 'Comprador',
  sendButton: 'Enviar',
  messagePlaceholder: 'Escribe un mensaje...',

  // app/mensajes/page.tsx
  messagesPageTitle: 'Mensajes',
  messagesPageSubtitle: 'Tus conversaciones con tiendas',
  asBuyerSectionTitle: 'Como comprador',
  asVendorSectionTitle: 'Como vendedor',
  emptyAsBuyer: 'Aún no tienes mensajes como comprador',
  emptyAsVendor: 'Aún no tienes mensajes como vendedor',
  emptyGeneric: 'Aún no tienes mensajes',
  noMessagesInConvoShort: 'Sin mensajes todavía',
  justNow: 'ahora',
  minutesAgo: 'hace {count} min',
  hoursAgo: 'hace {count}h',
  daysAgo: 'hace {count}d',

  // app/mensajes/[id]/page.tsx
  backToMessagesLink: 'Volver a mensajes',
  conversationNotFound: 'No se encontró esta conversación.',
  noMessagesInThread: 'Aún no hay mensajes en esta conversación.',
  verifiedTrustBadge: '✓ Verificado',
  newOnMercadoRD: 'Nuevo en MercadoRD',
  onMercadoRDSince: 'En MercadoRD {duration}',
  membershipMonthsSingular: 'hace {count} mes',
  membershipMonthsPlural: 'hace {count} meses',
  membershipYearsSingular: 'hace {count} año',
  membershipYearsPlural: 'hace {count} años',
}

export type ChatDict = typeof chat
