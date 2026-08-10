// ============================================================
// MercadoRD — i18n: namespace "directory" (français)
// Ruta: src/lib/i18n/fr/directory.ts
// ============================================================

import type { DirectoryDict } from '@/lib/i18n/es/directory'

export const directory = {
  breadcrumbHome: 'Accueil',
  unitsFallback: 'unités',
  clientFallback: 'Client',

  breadcrumbStores: 'Boutiques',
  storesPageTitle: 'Boutiques sur MercadoRD',
  activeStoreSingular: 'boutique active',
  activeStorePlural: 'boutiques actives',
  noStoresYet: 'Aucune boutique à afficher pour le moment.',
  verifiedBadge: 'Vérifiée',
  viewStoreLink: 'Voir la boutique →',

  providersPageTitle: 'Fournisseurs',
  providersPageSubtitle: 'Fabricants, grossistes et distributeurs dominicains — filtrez selon vos besoins',
  mobileFiltersButton: '⚙️ Filtres',
  searchingProviders: 'Recherche de fournisseurs...',
  noProvidersFound: "Nous n'avons trouvé aucun fournisseur avec ces filtres — essayez d'ajuster votre recherche",
  filtersDrawerTitle: 'Filtres',
  closeFiltersAria: 'Fermer les filtres',
  viewResultsButton: 'Voir les résultats',

  businessTypeFilterLabel: "Type d'entreprise",
  categoryFilterLabel: 'Catégorie',
  provinceFilterLabel: 'Province',
  allProvincesOption: 'Toutes',
  maxMoqFilterLabel: 'MOQ maximum',
  maxMoqPlaceholder: 'Afficher les fournisseurs avec MOQ ≤ X',
  servicesFilterLabel: 'Services',
  minVerificationFilterLabel: 'Niveau de vérification minimum',
  anyVerificationOption: "N'importe lequel",
  verifiedOrMoreOption: '✓ Entreprise vérifiée ou plus',
  manufacturerVerifiedOrMoreOption: '🏭 Fabricant vérifié ou plus',
  featuredOnlyOption: '⭐ Fournisseurs en vedette uniquement',

  whatsappButton: 'WhatsApp',
  instagramButton: 'Instagram',
  totalSalesLabel: 'Ventes totales',
  memberSinceLabel: 'Membre depuis ({duration})',
  membershipNew: 'nouveau',
  membershipMonthsSingular: 'il y a {count} mois',
  membershipMonthsPlural: 'il y a {count} mois',
  membershipYearsSingular: 'il y a {count} an',
  membershipYearsPlural: 'il y a {count} ans',
  providerInfoTitle: 'Informations sur le fournisseur',
  categoriesLabel: 'Catégories',
  servicesSectionLabel: 'Services',
  manufacturingSpecialtyLabel: 'Spécialité de fabrication',
  productionTimeLabel: '⏱️ Délai de production :',
  privateLabelLabel: '🏷️ Marque privée ?',
  yesValue: 'Oui',
  noValue: 'Non',
  customizationLabel: '🎨 Personnalisation ?',
  minOrderQuantityLabel: 'Quantité minimale de commande',
  targetCustomersLabel: 'Clientèle desservie',
  productsTitle: 'Produits',
  noProductsYet: "Cette boutique n'a pas encore de produits publiés.",
  recentReviewsTitle: 'Avis récents',
  noReviewsYet: "Cette boutique n'a pas encore d'avis.",
  reviewCountSingular: 'avis',
  reviewCountPlural: 'avis',
} satisfies DirectoryDict
