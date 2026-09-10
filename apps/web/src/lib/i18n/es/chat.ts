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

  // Adjuntos (imagen/video/documento) en el composer del chat
  attachFileAria: 'Adjuntar archivo',
  removeAttachmentAria: 'Quitar adjunto',
  viewAttachmentAria: 'Ver adjunto',
  downloadAttachmentLabel: 'Descargar',
  uploadingAttachmentsLabel: 'Subiendo adjuntos...',
  attachmentUploadError: 'No se pudo subir uno de los adjuntos. Intenta de nuevo.',

  // Presence — estado en línea del otro participante (efímero, nunca se persiste)
  onlineStatusLabel: '🟢 En línea',
  offlineStatusLabel: '⚫ Desconectado',

  // Solicitar cotización
  requestQuoteButton: 'Solicitar cotización',
  quoteQuantityInputLabel: 'Cantidad',
  sendQuoteRequestButton: 'Enviar solicitud',
  invalidQuantityError: 'Ingresa una cantidad válida',
  sendingButton: 'Enviando...',
  cancelButton: 'Cancelar',
  deliveryAddressLabel: 'La dirección de entrega',
  deliveryAddressPlaceholder: 'Calle, número, sector, referencia...',
  selectProvincePlaceholder: 'Selecciona una provincia',
  paymentCashLabel: 'Efectivo',
  paymentTransferLabel: 'Transferencia',
  paymentAzulLabel: 'Tarjeta (Azul)',
  paymentCardnetLabel: 'Tarjeta (CardNet)',

  // QuoteCard
  quoteCardTitle: 'Cotización',
  quoteQuantityLine: 'Cantidad: {count} unidades',
  catalogPriceLine: 'Precio de catálogo: {price}',
  waitingVendorResponse: 'Esperando respuesta del vendedor...',
  unitPriceInputLabel: 'Precio por unidad (RD$)',
  sendQuoteButton: 'Enviar',
  invalidPriceError: 'Ingresa un precio válido',
  quoteActionError: 'No se pudo procesar la cotización. Intenta de nuevo.',
  perUnitSuffix: '/ unidad',
  subtotalLine: 'Subtotal: {amount}',
  acceptQuoteButton: 'Aceptar cotización',
  confirmAcceptButton: 'Confirmar pedido',
  waitingBuyerAccept: 'Esperando que el comprador acepte...',
  adjustPriceLabel: 'Ajustar precio',
  quoteAcceptedLabel: 'Cotización aceptada — pedido creado',
  viewOrderLink: 'Ver pedido →',

  // Traducción de mensajes
  translateButton: 'Traducir',
  translatingButton: 'Traduciendo...',
  hideTranslationButton: 'Ocultar traducción',
  translateError: 'No se pudo traducir el mensaje. Intenta de nuevo.',
}

export type ChatDict = typeof chat
