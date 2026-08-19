// ============================================================
// MercadoRD — i18n: namespace "home" (English)
// Ruta: src/lib/i18n/en/home.ts
// ============================================================
// Debe cumplir HomeDict (definido en es/home.ts) — si falta o
// sobra una clave, TypeScript marca error de build.
// ============================================================

import type { HomeDict } from '@/lib/i18n/es/home'

export const home = {
  welcomeTitle: 'Buy and sell in RD',
  welcomeSubtitle: 'Thousands of products and stores near you.',
  exploreCta: 'Explore products',
  heroModelAlt: 'Customer smiling while using MercadoRD on her phone',
  slideGoToAria: 'Go to slide',

  perkSecurePaymentTitle: 'Secure payment',
  perkSecurePaymentSub: 'We protect your purchase',
  perkShippingTitle: 'Nationwide shipping',
  perkShippingSub: 'Fast and reliable',
  perkStoresTitle: 'Thousands of stores',
  perkStoresSub: 'Support local businesses',
  perkSupportTitle: '24/7 support',
  perkSupportSub: 'We\'re here to help',

  shippingStripMain: '🚚 FREE shipping on orders over RD${amount}',
  shippingStripProtected: 'Protected purchase',
  shippingStripStores: 'Thousands of stores',
  shippingStripSupport: '24/7 support',
} satisfies HomeDict
