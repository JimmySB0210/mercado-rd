// ============================================================
// MercadoRD — i18n: namespace "home" (Français)
// Ruta: src/lib/i18n/fr/home.ts
// ============================================================
// Debe cumplir HomeDict (definido en es/home.ts) — si falta o
// sobra una clave, TypeScript marca error de build.
// ============================================================

import type { HomeDict } from '@/lib/i18n/es/home'

export const home = {
  welcomeTitle: 'Achetez et vendez en RD',
  welcomeSubtitle: 'Des milliers de produits et boutiques près de vous.',
  exploreCta: 'Explorer les produits',
  heroModelAlt: 'Cliente souriante utilisant MercadoRD sur son téléphone',
  slideGoToAria: 'Aller à la diapositive',

  perkSecurePaymentTitle: 'Paiement sécurisé',
  perkSecurePaymentSub: 'Nous protégeons votre achat',
  perkShippingTitle: 'Livraison dans tout le pays',
  perkShippingSub: 'Rapide et fiable',
  perkStoresTitle: 'Des milliers de boutiques',
  perkStoresSub: 'Soutenez le commerce local',
  perkSupportTitle: 'Assistance 24/7',
  perkSupportSub: 'Nous sommes là pour vous aider',

  shippingStripMain: '🚚 Livraison GRATUITE dès RD${amount} d\'achats',
  shippingStripProtected: 'Achat protégé',
  shippingStripStores: 'Des milliers de boutiques',
  shippingStripSupport: 'Assistance 24/7',
} satisfies HomeDict
