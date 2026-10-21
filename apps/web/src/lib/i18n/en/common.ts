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
  searchHistoryHeading: 'Recent searches',
  clearSearchHistoryButton: 'Clear history',
  removeSearchHistoryItemAria: 'Remove from your history',
  shipTo: 'Ship to',
  countryShort: 'Dom. Rep.',
  allCountryOption: 'Dom. Rep. (whole country)',

  // Navbar — menú de cuenta
  accountGreeting: 'Hi, {name}',
  myAccountLabel: 'My account',
  myDashboard: 'My dashboard',
  myProfile: 'My profile',
  settings: 'Settings',
  adminPanel: 'Admin panel',
  accountMenuActivity: 'My activity',
  myFavorites: 'My favorites',
  giftLists: 'Gift list',
  history: 'History',
  messages: 'Messages',
  accountMenuAssistance: 'Assistance',
  helpAndSupport: 'Help & support',
  support: 'Support',
  logout: 'Log out',
  login: 'Log in',

  // Navbar — CTA y categorías
  sellCta: 'Sell on RD',
  allCategories: 'All categories',
  providers: 'Providers',
  offers: 'Deals',
  officialStores: 'Official stores',
  helpNav: 'Help',
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
  helpCenter: 'Help center',
  supportCenter: 'Support center',
  terms: 'Terms and conditions',
  privacyPolicy: 'Privacy policy',
  // ── "About" column (acerca-de) ──
  footerSectionAbout: 'About',
  footerAboutUs: 'About us',
  footerCommitment: 'Our commitment',
  footerWhyChooseUs: 'Why choose us',
  footerResponsibility: 'Responsibility',
  copyright: '© 2026 MercadoRD. All rights reserved.',
  securePayments: 'Secure payments with Visa, Mastercard and Azul',

  ageConfirmationTitle: 'Age-restricted content',
  ageConfirmationBody: 'This content is for adults 18 and over. Do you confirm you are 18 or older?',
  ageConfirmationContinue: 'Continue',
  ageConfirmationBack: 'Go back',

  // PushNotificationButton — avisos del navegador
  pushEnable: 'Enable notifications',
  pushEnabling: 'Enabling...',
  pushEnabled: 'Notifications enabled',
  pushDisable: 'Disable notifications',
  pushDisabling: 'Disabling...',
  pushErrorTimeout: 'Could not enable (it took too long). Please try again.',
  pushErrorSubscribe: 'Could not enable notifications. Please try again.',
  pushErrorUnsubscribe: 'Could not disable notifications. Please try again.',

  // Teléfonos (lib/phone.ts, lib/hooks/usePhoneField.ts)
  phoneInvalid: 'Enter a valid Dominican number (809, 829 or 849)',
  whatsappHelp: 'This is the number your customers will use to message you on WhatsApp',
} satisfies CommonDict
