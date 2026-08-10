// ============================================================
// MercadoRD — i18n: namespace "checkout" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/checkout.ts
// ============================================================
// Texto de app/checkout/page.tsx, app/confirm/page.tsx y
// components/order/DownloadInvoiceButton.tsx. Incluye mensajes de
// error/validación que solo aparecen cuando algo falla — no solo el
// texto estático visible. Claves con {variable} soportan
// interpolación vía t(key, params) — ver lib/hooks/useTranslation.ts.
// ============================================================

export const checkout = {
  // Carrito vacío
  emptyCartTitle: 'Tu carrito está vacío',
  emptyCartSub: 'Agrega productos antes de ir al checkout',
  exploreProducts: 'Explorar productos',

  // Dirección de entrega
  deliveryAddressHeading: 'Dirección de entrega',
  fullNamePlaceholder: 'Nombre completo *',
  phonePlaceholder: 'Teléfono *',
  addressPlaceholder: 'Dirección completa *',
  selectProvincePlaceholder: 'Selecciona tu provincia *',
  notesPlaceholder: 'Instrucciones de entrega (opcional)',

  // Método de pago
  paymentMethodHeading: 'Método de pago',
  paymentAzulLabel: 'Tarjeta (Azul)',
  paymentCardnetLabel: 'Tarjeta (CardNet)',
  paymentTransferLabel: 'Transferencia',
  paymentCashLabel: 'Efectivo',
  cardNumberPlaceholder: 'Número de tarjeta *',
  cardExpirationPlaceholder: 'MMAA *',
  cardCvcPlaceholder: 'CVC *',
  mockModeNotice: '💡 Modo simulado activo — cualquier tarjeta aprueba, excepto una que termine en 0000.',
  cardnetRedirectNotice: '💡 Serás redirigido al portal seguro de CardNet para completar el pago.',

  // Resumen del pedido
  orderItemsCountOne: 'Tu pedido ({count} artículo)',
  orderItemsCountOther: 'Tu pedido ({count} artículos)',
  couponQuestion: '¿Tienes un cupón?',
  couponPlaceholder: 'CÓDIGO',
  removeCoupon: 'Quitar',
  applyCoupon: 'Aplicar',
  couponGenericError: 'No se pudo validar el cupón',
  couponAppliedMsg: '✓ Cupón {code} aplicado',
  subtotalLabel: 'Subtotal',
  shippingLabel: 'Envío',
  shippingDaysOne: '{count} día',
  shippingDaysOther: '{count} días',
  shippingDaysRange: '{min}-{max} días',
  selectProvinceHint: 'Selecciona provincia',
  calculatingShipping: 'Calculando...',
  freeBadge: 'GRATIS 🎉',
  itbisLabel: 'ITBIS (18%)',
  discountLabel: 'Descuento ({code})',
  totalLabel: 'Total',

  // Aceptación de términos
  acceptTermsPrefix: 'Al confirmar, aceptas nuestros',
  termsOfServiceLink: 'Términos de Servicio',
  andWord: 'y',
  privacyPolicyLink: 'Política de Privacidad',

  // Botón de confirmar
  processingPayment: 'Procesando...',
  calculatingShippingButton: 'Calculando envío...',
  rateLimitedButton: 'Bloqueado temporalmente',
  confirmAndPay: 'Confirmar y pagar',
  securePaymentNotice: 'Pago seguro — tu información está protegida',

  // Validación y errores
  requiredFieldsError: 'Por favor completa todos los campos obligatorios',
  cardDetailsRequired: 'Completa los datos de la tarjeta',
  waitingShippingCalc: 'Espera un momento, estamos calculando el costo de envío',
  rateLimitFallback: 'Demasiados intentos. Espera 15 minutos antes de intentar de nuevo.',
  addressLengthError: 'La dirección debe tener entre {min} y {max} caracteres',
  addressInvalidChars: 'La dirección contiene caracteres no permitidos',
  notesTooLong: 'Las notas no pueden superar {max} caracteres',
  notesInvalidChars: 'Las notas contienen caracteres no permitidos',
  paymentDeclined: 'Transacción rechazada — verifica los datos de tu tarjeta e intenta de nuevo',
  paymentErrorGeneric: 'No se pudo procesar el pago. Intenta de nuevo.',
  genericOrderError: 'Ocurrió un error al procesar tu pedido. Intenta de nuevo.',

  // confirm/page.tsx
  orderNotFound: 'No se encontró el número de pedido.',
  backToHome: 'Volver al inicio',
  orderConfirmedTitle: '¡Pedido confirmado!',
  thankYouMessage: 'Gracias por comprar en MercadoRD 🇩🇴',
  whatsappConfirmationNotice: 'Recibirás confirmación por WhatsApp en los próximos minutos.',
  deliveryHeading: '📍 ENTREGA',
  productsHeading: '📦 PRODUCTOS',
  totalPaidLabel: 'Total pagado',
  contactVendorHeadingOne: '📲 CONTACTAR VENDEDOR',
  contactVendorHeadingOther: '📲 CONTACTAR VENDEDORES',
  contactVendorButton: 'Contactar a {name}',
  continueShoppingArrow: 'Seguir comprando →',
  viewMyOrders: 'Ver mis pedidos',
  protectedByMercadoRD: '🛡️ Compra protegida por MercadoRD',
  protectedGuaranteeText: 'Si el producto no llega o no es como se describe, te devolvemos tu dinero completo.',

  // DownloadInvoiceButton
  generatingInvoice: 'Generando...',
  downloadInvoice: '📄 Descargar factura',
}

export type CheckoutDict = typeof checkout
