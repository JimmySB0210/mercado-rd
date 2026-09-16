// ============================================================
// MercadoRD — i18n: namespace "home" (Français)
// Ruta: src/lib/i18n/fr/home.ts
// ============================================================
// Debe cumplir HomeDict (definido en es/home.ts) — si falta o
// sobra una clave, TypeScript marca error de build.
// ============================================================

import type { HomeDict } from '@/lib/i18n/es/home'

export const home = {
  heroKicker: 'Votre marketplace de confiance',
  heroTagline: 'Ce dont vous avez besoin, ici même',
  welcomeTitle: 'Des produits uniques, du monde entier',
  welcomeSubtitle: 'Connectez-vous à des milliers de fournisseurs et trouvez ce dont vous avez besoin, sans quitter la République dominicaine.',
  exploreCta: 'Explorer les catégories →',
  heroModelAlt: 'Cliente souriante utilisant MercadoRD sur son téléphone',
  slideGoToAria: 'Aller à la diapositive',

  perkSecurePaymentTitle: 'Achat sûr et protégé',
  perkSecurePaymentSub: 'Nous protégeons votre achat',
  perkShippingTitle: 'Livraison rapide dans tout le pays',
  perkShippingSub: 'Rapide et fiable',
  perkStoresTitle: 'Des milliers de boutiques',
  perkStoresSub: 'Soutenez le commerce local',
  perkSupportTitle: 'Assistance 24/7 en espagnol',
  perkSupportSub: 'Nous sommes là pour vous aider',

  shippingStripMain: '🚚 Livraison GRATUITE dès RD${amount} d\'achats',
  shippingStripProtected: 'Achat protégé',
  shippingStripStores: 'Des milliers de boutiques',
  shippingStripSupport: 'Assistance 24/7',
} satisfies HomeDict
