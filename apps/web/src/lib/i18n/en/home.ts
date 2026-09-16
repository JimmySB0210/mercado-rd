// ============================================================
// MercadoRD — i18n: namespace "home" (English)
// Ruta: src/lib/i18n/en/home.ts
// ============================================================
// Debe cumplir HomeDict (definido en es/home.ts) — si falta o
// sobra una clave, TypeScript marca error de build.
// ============================================================

import type { HomeDict } from '@/lib/i18n/es/home'

export const home = {
  heroKicker: 'Your trusted marketplace',
  heroTagline: 'What you need, right here',
  welcomeTitle: 'Unique products, from all over the world',
  welcomeSubtitle: 'Connect with thousands of vendors and find what you need, without leaving the Dominican Republic.',
  exploreCta: 'Explore categories →',
  heroModelAlt: 'Customer smiling while using MercadoRD on her phone',
  slideGoToAria: 'Go to slide',

  perkSecurePaymentTitle: 'Safe, protected shopping',
  perkSecurePaymentSub: 'We protect your purchase',
  perkShippingTitle: 'Fast shipping nationwide',
  perkShippingSub: 'Fast and reliable',
  perkStoresTitle: 'Thousands of stores',
  perkStoresSub: 'Support local businesses',
  perkSupportTitle: '24/7 support in Spanish',
  perkSupportSub: 'We\'re here to help',

  shippingStripMain: '🚚 FREE shipping on orders over RD${amount}',
  shippingStripProtected: 'Protected purchase',
  shippingStripStores: 'Thousands of stores',
  shippingStripSupport: '24/7 support',
} satisfies HomeDict
