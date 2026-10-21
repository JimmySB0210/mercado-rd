// ============================================================
// MercadoRD — i18n: namespace "common" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/common.ts
// ============================================================
// Texto compartido entre páginas: Navbar, Footer, botones y mensajes
// genéricos. El tipo CommonDict se deriva de este archivo — los
// diccionarios en/fr deben cumplirlo (satisfies CommonDict), así
// TypeScript marca error de build si falta una clave.
// ============================================================

export const common = {
  // Navbar — búsqueda y ubicación
  searchPlaceholder: 'Buscar productos, tiendas...',
  searchHistoryHeading: 'Búsquedas recientes',
  clearSearchHistoryButton: 'Borrar historial',
  removeSearchHistoryItemAria: 'Quitar de tu historial',
  shipTo: 'Enviar a',
  countryShort: 'Rep. Dom.',
  allCountryOption: 'Rep. Dom. (todo el país)',

  // Navbar — menú de cuenta
  accountGreeting: 'Hola, {name}',
  myAccountLabel: 'Mi cuenta',
  myDashboard: 'Mi dashboard',
  myProfile: 'Mi perfil',
  settings: 'Configuración',
  adminPanel: 'Panel admin',
  accountMenuActivity: 'Mi actividad',
  myFavorites: 'Mis favoritos',
  giftLists: 'Lista de regalos',
  history: 'Historial',
  messages: 'Mensajes',
  accountMenuAssistance: 'Asistencia',
  helpAndSupport: 'Ayuda y soporte',
  support: 'Soporte',
  logout: 'Cerrar sesión',
  login: 'Iniciar sesión',

  // Navbar — CTA y categorías
  sellCta: 'Vender en RD',
  allCategories: 'Todas las categorías',
  providers: 'Proveedores',
  offers: 'Ofertas',
  officialStores: 'Tiendas oficiales',
  helpNav: 'Ayuda',
  categoriesDrawerTitle: 'Categorías',
  closeCategoriesMenuAria: 'Cerrar menú de categorías',

  // Footer
  footerTagline: 'El marketplace dominicano para comprar y vender en las 32 provincias 🇩🇴',
  footerSectionBuy: 'Comprar',
  footerSectionSell: 'Vender',
  footerSectionHelp: 'Ayuda',
  allStores: 'Todas las tiendas',
  favorites: 'Favoritos',
  myOrders: 'Mis pedidos',
  myStore: 'Mi tienda',
  helpCenter: 'Centro de ayuda',
  supportCenter: 'Centro de soporte',
  terms: 'Términos y condiciones',
  privacyPolicy: 'Política de privacidad',
  // ── Columna "Nosotros" (acerca-de) ──
  footerSectionAbout: 'Nosotros',
  footerAboutUs: 'Acerca de',
  footerCommitment: 'Compromiso',
  footerWhyChooseUs: 'Por qué elegirnos',
  footerResponsibility: 'Responsabilidad',
  copyright: '© 2026 MercadoRD. Todos los derechos reservados.',
  securePayments: 'Pagos seguros con Visa, Mastercard y Azul',

  // AgeConfirmationModal — categorías/productos con requires_age_confirmation
  ageConfirmationTitle: 'Contenido para mayores de edad',
  ageConfirmationBody: 'Este contenido es para mayores de 18 años. ¿Confirmas que tienes 18 años o más?',
  ageConfirmationContinue: 'Continuar',
  ageConfirmationBack: 'Volver',

  // PushNotificationButton — avisos del navegador
  pushEnable: 'Activar notificaciones',
  pushEnabling: 'Activando...',
  pushEnabled: 'Notificaciones activadas',
  pushDisable: 'Desactivar notificaciones',
  pushDisabling: 'Desactivando...',
  pushErrorTimeout: 'No se pudo activar (tardó demasiado). Intenta de nuevo.',
  pushErrorSubscribe: 'No se pudieron activar las notificaciones. Intenta de nuevo.',
  pushErrorUnsubscribe: 'No se pudieron desactivar las notificaciones. Intenta de nuevo.',

  // Teléfonos (lib/phone.ts, lib/hooks/usePhoneField.ts)
  phoneInvalid: 'Ingresa un número dominicano válido (809, 829 o 849)',
  whatsappHelp: 'Es el número con el que te escribirán tus clientes por WhatsApp',
}

export type CommonDict = typeof common
