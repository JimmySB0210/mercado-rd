// ============================================================
// MercadoRD — i18n: namespace "home" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/home.ts
// ============================================================
// Texto de la homepage: hero banner (bienvenida + perks). El tipo
// HomeDict se deriva de este archivo — en/fr deben cumplirlo.
// ============================================================

export const home = {
  heroKicker: 'Tu marketplace de confianza',
  heroTagline: 'Lo que necesitas, está aquí',
  welcomeTitle: 'Productos únicos, de todo el mundo',
  welcomeSubtitle: 'Conecta con miles de proveedores y encuentra lo que necesitas, sin salir de República Dominicana.',
  exploreCta: 'Explorar categorías →',
  heroModelAlt: 'Clienta sonriendo mientras usa MercadoRD desde su celular',
  slideGoToAria: 'Ir a diapositiva',

  perkSecurePaymentTitle: 'Compra segura y protegida',
  perkSecurePaymentSub: 'Protegemos tu compra',
  perkShippingTitle: 'Envíos rápidos a todo el país',
  perkShippingSub: 'Rápido y confiable',
  perkStoresTitle: 'Miles de tiendas',
  perkStoresSub: 'Apoya lo local',
  perkSupportTitle: 'Soporte 24/7 en español',
  perkSupportSub: 'Estamos para ayudarte',

  // ShippingBenefitsStrip — franja aparte, debajo del hero (Fase 2A
  // Batch 2): NO reemplaza PerksSlide (dentro del carrusel) ni el
  // trust bar de HomeProductGrid.tsx, son 3 franjas distintas por ahora.
  shippingStripMain: '🚚 Envío GRATIS en compras desde RD${amount}',
  shippingStripProtected: 'Compra protegida',
  shippingStripStores: 'Miles de tiendas',
  shippingStripSupport: 'Soporte 24/7',
}

export type HomeDict = typeof home
