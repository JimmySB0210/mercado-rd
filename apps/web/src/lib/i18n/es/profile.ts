// ============================================================
// MercadoRD — i18n: namespace "profile" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/profile.ts
// ============================================================
// Cubre app/perfil/**, components/order/DisputeModal.tsx,
// components/shop/OrderTimeline.tsx y components/shop/WishlistButton.tsx.
// Grupos anidados (orderStatus, timelineStep, disputeReason,
// disputeStatus) se comparten entre varios archivos — ver DotPaths<T>
// en useTranslation.ts.
// ============================================================

export const profile = {
  // Genérico (reutilizado en varios archivos de este namespace)
  loading: 'Cargando...',
  exploreProductsLink: 'Explorar productos',
  cancelButton: 'Cancelar',
  confirmButton: 'Confirmar',
  defaultUserName: 'Usuario',

  // app/perfil/page.tsx
  roleVendor: 'Vendedor',
  roleBuyer: 'Comprador',
  infoSectionTitle: 'Información',
  nameLabel: 'Nombre',
  emailLabel: 'Correo',
  phoneLabel: 'Teléfono',
  provinceLabel: 'Provincia',
  dominicanRepublic: 'República Dominicana',
  myOrdersLink: 'Mis pedidos',
  sellOnMercadoRD: 'Vender en MercadoRD',
  signOutButton: 'Cerrar sesión',

  // app/perfil/pedidos/page.tsx
  loadingOrders: 'Cargando tus pedidos...',
  ordersPageTitle: 'Mis pedidos',
  orderSingular: 'pedido',
  orderPlural: 'pedidos',
  emptyOrdersMessage: 'Aún no has hecho ningún pedido.',
  leaveReviewButton: 'Dejar reseña',
  reviewedLabel: '✓ Reseñado',
  trackingNumberLabel: '📦 Número de seguimiento: {number}',
  trackingHint: 'Contacta a tu courier con este número para rastrear tu paquete.',
  deliveryOtpSentTitle: '🔐 Código de entrega enviado',
  deliveryOtpSentHint: 'Revisa tus notificaciones para ver tu código — solo lo necesitas cuando el repartidor tenga tu producto en mano.',
  hideTimelineButton: 'Ocultar seguimiento ▴',
  showTimelineButton: 'Ver seguimiento ▾',
  orderTotalLabel: 'Total del pedido',
  viewDisputeLink: 'Ver disputa →',
  openDisputeButton: 'Abrir disputa',
  refundIneligibleFood: 'Los productos de alimentos no son elegibles para devolución',
  refundIneligibleWindowExpired: 'Ya pasaron los 7 días para devolución',

  // components/shop/OrderTimeline.tsx
  loadingTimeline: 'Cargando seguimiento...',
  timelineStep: {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  },

  // Badge de estado del pedido (con emoji) — pedidos/page.tsx
  orderStatus: {
    pending: '⏳ Pendiente',
    confirmed: '✅ Confirmado',
    preparing: '📦 Preparando',
    shipped: '🚚 Enviado',
    delivered: '✔️ Entregado',
    cancelled: '❌ Cancelado',
  },

  // app/perfil/favoritos/page.tsx
  favoritesPageTitle: 'Mis favoritos',
  savedProductSingular: 'producto guardado',
  savedProductPlural: 'productos guardados',
  emptyFavoritesMessage: 'Aún no tienes productos favoritos.',
  emptyFavoritesHint: 'Toca el corazón en cualquier producto para guardarlo aquí.',

  // app/perfil/historial/page.tsx
  historyPageTitle: 'Historial',
  viewedProductSingular: 'producto visto',
  viewedProductPlural: 'productos vistos',
  recentlySuffix: 'recientemente',
  emptyHistoryMessage: 'Aún no has visto ningún producto.',

  // app/perfil/disputas/page.tsx
  loadingDisputes: 'Cargando tus disputas...',
  disputesPageTitle: 'Mis disputas',
  disputeSingular: 'disputa',
  disputePlural: 'disputas',
  emptyDisputesMessage: 'No tienes disputas abiertas.',
  emptyDisputesHint: 'Si tienes un problema con un pedido, puedes abrir una disputa desde "Mis pedidos".',
  viewDetailLink: 'Ver detalle →',

  // app/perfil/disputas/[id]/page.tsx
  loadingDisputeDetail: 'Cargando disputa...',
  disputeNotFound: 'No se encontró esta disputa.',
  backToDisputesLink: 'Volver a mis disputas',
  orderNumberLabel: 'Pedido #{id}',
  openedOnLabel: 'Abierta el {date}',
  resolutionTitle: 'Resolución de MercadoRD',
  messagesTitle: 'Mensajes',
  noMessagesYet: 'Aún no hay mensajes en esta disputa.',
  senderVendorLabel: 'Vendedor',
  disputeClosedNotice: 'Esta disputa está {status} — no se pueden enviar más mensajes.',
  messagePlaceholder: 'Escribe un mensaje...',
  sendButton: 'Enviar',
  sendMessageError: 'No se pudo enviar el mensaje. Intenta de nuevo.',

  // Razones y estados de disputa, compartidos entre disputas/page.tsx,
  // disputas/[id]/page.tsx y DisputeModal.tsx
  disputeReason: {
    not_received: 'No recibí el pedido',
    not_as_described: 'No es como se describe',
    damaged: 'Llegó dañado',
    wrong_item: 'Producto equivocado',
    refund_request: 'Solicito reembolso',
    other: 'Otro',
  },
  disputeStatus: {
    open: 'Abierta',
    reviewing: 'En revisión',
    resolved: 'Resuelta',
    closed: 'Cerrada',
  },

  // components/order/DisputeModal.tsx
  openDisputeTitle: 'Abrir disputa',
  reasonLabel: 'Razón *',
  selectReasonOption: 'Selecciona una razón',
  refundRequestUnavailable: '"Solicito reembolso" no está disponible para este pedido: {reason}.',
  describeProblemLabel: 'Describe el problema *',
  minCharsHint: '(mínimo 20 caracteres)',
  describePlaceholder: 'Cuéntanos qué pasó con tu pedido...',
  charCounter: '{count}/20',
  reasonRequired: 'Selecciona una razón',
  descriptionTooShort: 'Describe el problema con al menos 20 caracteres',
  openDisputeError: 'No se pudo abrir la disputa. Intenta de nuevo.',
  sendingButton: 'Enviando...',

  // app/perfil/seguridad/page.tsx
  securityPageTitle: 'Seguridad de la cuenta',
  securityPageSubtitle: 'Protege el acceso a tu cuenta de MercadoRD',
  changePasswordTitle: 'Cambiar contraseña',
  newPasswordPlaceholder: 'Contraseña nueva',
  confirmNewPasswordPlaceholder: 'Confirma la contraseña nueva',
  passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
  passwordMismatch: 'Las contraseñas no coinciden',
  passwordChangeError: 'No se pudo cambiar la contraseña. Intenta de nuevo.',
  passwordChangeSuccess: '✓ Contraseña actualizada correctamente',
  updatePasswordButton: 'Actualizar contraseña',
  savingButton: 'Guardando...',
  mfaTitle: 'Autenticación de dos factores (MFA)',
  mfaActive: 'MFA activado ✓',
  deactivateButton: 'Desactivar',
  deactivatingButton: 'Desactivando...',
  mfaScanInstructions: 'Escanea este código QR con Google Authenticator (o una app similar) y luego ingresa el código de 6 dígitos.',
  mfaQrAlt: 'Código QR para MFA',
  mfaCodePlaceholder: 'Código de 6 dígitos',
  mfaEnrollHint: 'Agrega una capa extra de seguridad pidiendo un código de tu app de autenticación al iniciar sesión.',
  activateMfaButton: 'Activar MFA',
  startingButton: 'Iniciando...',
  mfaEnrollStartError: 'No se pudo iniciar la activación de MFA. Intenta de nuevo.',
  mfaCodeRequired: 'Ingresa el código de 6 dígitos',
  mfaVerifyError: 'Código incorrecto. Intenta de nuevo.',
  mfaUnenrollError: 'No se pudo desactivar MFA. Intenta de nuevo.',

  // components/shop/WishlistButton.tsx
  removeFromFavoritesAria: 'Quitar de favoritos',
  addToFavoritesAria: 'Agregar a favoritos',
}

export type ProfileDict = typeof profile
