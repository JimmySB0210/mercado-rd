// ============================================================
// MercadoRD — i18n: namespace "common" (English)
// Ruta: src/lib/i18n/en/common.ts
// ============================================================
// Debe cumplir CommonDict (definido en es/common.ts) — si falta o
// sobra una clave, TypeScript marca error de build.
// ============================================================

import type { CommonDict } from '@/lib/i18n/es/common'

export const common = {
  // Navbar — búsqueda y ubicación
  searchPlaceholder: 'Search products, stores...',
  shipTo: 'Ship to',
  countryShort: 'Dom. Rep.',
  allCountryOption: 'Dom. Rep. (whole country)',

  // Navbar — menú de cuenta
  myDashboard: 'My dashboard',
  myFavorites: 'My favorites ♡',
  history: 'History 🕐',
  messages: 'Messages',
  myProfile: 'My profile',
  adminPanel: 'Admin panel',
  security: 'Security 🔒',
  support: 'Support',
  logout: 'Log out',
  login: 'Log in',

  // Navbar — CTA y categorías
  sellCta: 'Sell on RD',
  allCategories: 'All categories',
  providers: 'Providers',
  categoriesDrawerTitle: 'Categories',
  closeCategoriesMenuAria: 'Close categories menu',

  // Footer
  footerTagline: 'The Dominican marketplace to buy and sell across all 32 provinces 🇩🇴',
  footerSectionBuy: 'Shop',
  footerSectionSell: 'Sell',
  footerSectionHelp: 'Help',
  allStores: 'All stores',
  favorites: 'Favorites',
  myOrders: 'My orders',
  myStore: 'My store',
  supportCenter: 'Support center',
  terms: 'Terms and conditions',
  privacyPolicy: 'Privacy policy',
  copyright: '© 2026 MercadoRD. All rights reserved.',
  securePayments: 'Secure payments with Visa, Mastercard and Azul',
} satisfies CommonDict
