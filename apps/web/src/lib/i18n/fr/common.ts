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
  searchHistoryHeading: 'Recherches récentes',
  clearSearchHistoryButton: "Effacer l'historique",
  removeSearchHistoryItemAria: 'Retirer de votre historique',
  shipTo: 'Livrer à',
  countryShort: 'Rép. Dom.',
  allCountryOption: 'Rép. Dom. (tout le pays)',

  // Navbar — menú de cuenta
  accountGreeting: 'Bonjour, {name}',
  myAccountLabel: 'Mon compte',
  myDashboard: 'Mon tableau de bord',
  myFavorites: 'Mes favoris ♡',
  giftLists: 'Liste de cadeaux 🎁',
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
  offers: 'Offres',
  officialStores: 'Boutiques officielles',
  helpNav: 'Aide',
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
  helpCenter: "Centre d'aide",
  supportCenter: 'Centre d\'assistance',
  terms: 'Conditions générales',
  privacyPolicy: 'Politique de confidentialité',
  copyright: '© 2026 MercadoRD. Tous droits réservés.',
  securePayments: 'Paiements sécurisés avec Visa, Mastercard et Azul',

  ageConfirmationTitle: 'Contenu réservé aux adultes',
  ageConfirmationBody: 'Ce contenu est réservé aux personnes de 18 ans ou plus. Confirmez-vous avoir 18 ans ou plus ?',
  ageConfirmationContinue: 'Continuer',
  ageConfirmationBack: 'Retour',
} satisfies CommonDict
