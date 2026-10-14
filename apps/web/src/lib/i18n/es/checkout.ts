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
  phonePlaceholder: 'Teléfono * (809-555-1234)',
  addressPlaceholder: 'Dirección completa *',
  selectProvincePlaceholder: 'Selecciona tu provincia *',
  notesPlaceholder: 'Instrucciones de entrega (opcional)',
  isForSomeoneElseLabel: 'Es para otra persona',
  recipientNamePlaceholder: 'Nombre de quien recibe *',
  recipientPhonePlaceholder: 'Teléfono de quien recibe * (809-555-1234)',
  recipientNameRequiredError: 'Escribe el nombre de quien va a recibir el pedido (mínimo 3 caracteres)',
  recipientPhoneRequiredError: 'Escribe el teléfono de quien va a recibir el pedido',

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
  freeBadge: 'GRATIS',
  freeShippingThresholdNote: 'Envío gratis desde RD$2,500 por pedido',
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
  selfPurchaseError: 'No puedes comprar tus propios productos.',

  // confirm/page.tsx
  orderNotFound: 'No se encontró el número de pedido.',
  backToHome: 'Volver al inicio',
  orderConfirmedTitle: '¡Pedido confirmado!',
  thankYouMessage: 'Gracias por comprar en MercadoRD 🇩🇴',
  whatsappConfirmationNotice: 'Recibirás confirmación por WhatsApp en los próximos minutos.',
  deliveryHeading: '📍 ENTREGA',
  giftAddressProtected: 'Dirección protegida: la tienda la recibe directamente',
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

  // Cotización del servidor, cupones y errores del pedido (lib/cart/quote.ts, lib/orderErrors.ts)
  lineUnavailable: 'Este producto ya no está disponible',
  onlyNLeft: 'Solo quedan {count}',
  itemsBlockedNotice: 'Algunos productos ya no están disponibles o no tienen stock suficiente.',
  backToCart: 'Volver al carrito',
  quoteLoadingButton: 'Calculando total...',
  quoteErrorNotice: 'No pudimos calcular el total de tu pedido.',
  retryButton: 'Reintentar',
  quoteFailedSubmit: 'No pudimos confirmar el total. Inténtalo de nuevo; no se hizo ningún cobro.',
  pricesChangedNotice: 'Los precios o el envío cambiaron, revisa el total antes de pagar.',
  stockChangedNotice: 'Algunos productos ya no tienen stock suficiente. Revisa tu pedido; no se hizo ningún cobro.',
  couponLoginRequired: 'Inicia sesión para usar un cupón',
  couponErrNotFound: 'Este cupón no existe',
  couponErrExpired: 'Este cupón ya venció',
  couponErrLimitReached: 'Este cupón ya alcanzó su límite de usos',
  couponErrMinOrder: 'Este cupón requiere un pedido mínimo de RD${amount}',
  couponErrRateLimited: 'Demasiados intentos. Espera unos minutos antes de probar otro cupón.',
  couponErrInvalidTotal: 'No pudimos validar el cupón con el total de este pedido.',
  couponStoreOnly: 'Este cupón solo aplica a productos de una tienda específica',
  couponRemovedNotice: 'El cupón ya no es válido para este pedido y se quitó. Revisa el total.',
  productUnavailableError: 'Uno de los productos ya no está disponible. Revisa tu carrito.',
  variantUnavailableError: 'Una de las opciones elegidas ya no está disponible. Revisa tu carrito.',
  insufficientStockError: 'No hay stock suficiente para uno de los productos. Revisa tu carrito.',
  pricesChangedError: 'Los precios cambiaron. Revisa el total antes de pagar.',
  couponInvalidError: 'El cupón ya no es válido para este pedido.',
}

export type CheckoutDict = typeof checkout
