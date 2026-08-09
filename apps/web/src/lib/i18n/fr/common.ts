// ============================================================
// MercadoRD — i18n: namespace "common" (Français)
// Ruta: src/lib/i18n/fr/common.ts
// ============================================================
// Debe cumplir CommonDict (definido en es/common.ts) — si falta o
// sobra una clave, TypeScript marca error de build.
// ============================================================

import type { CommonDict } from '@/lib/i18n/es/common'

export const common = {
  // Navbar — búsqueda y ubicación
  searchPlaceholder: 'Rechercher des produits, boutiques...',
  shipTo: 'Livrer à',
  countryShort: 'Rép. Dom.',
  allCountryOption: 'Rép. Dom. (tout le pays)',

  // Navbar — menú de cuenta
  myDashboard: 'Mon tableau de bord',
  myFavorites: 'Mes favoris ♡',
  history: 'Historique 🕐',
  messages: 'Messages',
  myProfile: 'Mon profil',
  adminPanel: 'Panneau admin',
  security: 'Sécurité 🔒',
  support: 'Assistance',
  logout: 'Se déconnecter',
  login: 'Se connecter',

  // Navbar — CTA y categorías
  sellCta: 'Vendre sur RD',
  allCategories: 'Toutes les catégories',
  providers: 'Fournisseurs',
  categoriesDrawerTitle: 'Catégories',
  closeCategoriesMenuAria: 'Fermer le menu des catégories',

  // Footer
  footerTagline: 'La marketplace dominicaine pour acheter et vendre dans les 32 provinces 🇩🇴',
  footerSectionBuy: 'Acheter',
  footerSectionSell: 'Vendre',
  footerSectionHelp: 'Aide',
  allStores: 'Toutes les boutiques',
  favorites: 'Favoris',
  myOrders: 'Mes commandes',
  myStore: 'Ma boutique',
  supportCenter: 'Centre d\'assistance',
  terms: 'Conditions générales',
  privacyPolicy: 'Politique de confidentialité',
  copyright: '© 2026 MercadoRD. Tous droits réservés.',
  securePayments: 'Paiements sécurisés avec Visa, Mastercard et Azul',
} satisfies CommonDict
