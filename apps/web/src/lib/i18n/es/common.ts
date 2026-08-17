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
  shipTo: 'Enviar a',
  countryShort: 'Rep. Dom.',
  allCountryOption: 'Rep. Dom. (todo el país)',

  // Navbar — menú de cuenta
  accountGreeting: 'Hola, {name}',
  myAccountLabel: 'Mi cuenta',
  myDashboard: 'Mi dashboard',
  myFavorites: 'Mis favoritos ♡',
  history: 'Historial 🕐',
  messages: 'Mensajes',
  myProfile: 'Mi perfil',
  adminPanel: 'Panel admin',
  security: 'Seguridad 🔒',
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
  supportCenter: 'Centro de soporte',
  terms: 'Términos y condiciones',
  privacyPolicy: 'Política de privacidad',
  copyright: '© 2026 MercadoRD. Todos los derechos reservados.',
  securePayments: 'Pagos seguros con Visa, Mastercard y Azul',
}

export type CommonDict = typeof common
