// ============================================================
// MercadoRD — i18n: namespace "giftLists" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/giftLists.ts
// ============================================================
// Cubre la página pública app/regalo/[slug]/page.tsx (y su Content
// component), y app/regalo/[slug]/gracias/page.tsx. Los mensajes de
// error que retorna create_gift_order() se muestran tal cual vienen
// de la BD — nunca se traducen ni se reformulan aquí.
// ============================================================

export const giftLists = {
  // Página pública /regalo/[slug]
  creatorHeading: '🎁 Lista de regalos de {alias}',
  locationLine: '📍 {city}',
  priorityHigh: 'Alta',
  priorityMedium: 'Media',
  priorityLow: 'Baja',
  alreadyGiftedBadge: 'Ya regalado 🎁',
  giftThisButton: 'Regalar esto',
  choosePaymentLabel: '¿Cómo quieres pagar?',
  paymentAzulLabel: 'Tarjeta (Azul)',
  paymentCardnetLabel: 'Tarjeta (CardNet)',
  paymentTransferLabel: 'Transferencia',
  paymentCashLabel: 'Efectivo',
  givingButton: 'Regalando...',
  genericGiftError: 'No se pudo procesar el regalo. Intenta de nuevo.',
  cancelButton: 'Cancelar',
  emptyListMessage: 'Esta lista de regalos todavía no tiene productos.',
  listUnavailableTitle: 'Esta lista ya no está disponible',
  listUnavailableHint: 'El enlace pudo haber expirado o el creador la desactivó.',

  // /regalo/[slug]/gracias
  thankYouTitle: '¡Listo! Le compraste un regalo a {alias}',
  thankYouHint: 'El dueño de la lista recibirá el código de entrega — tú ya cumpliste tu parte 🎉',
  backHomeLink: 'Volver al inicio',
}

export type GiftListsDict = typeof giftLists
