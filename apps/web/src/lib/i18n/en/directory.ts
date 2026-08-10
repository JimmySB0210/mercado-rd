// ============================================================
// MercadoRD — i18n: namespace "directory" (English)
// Ruta: src/lib/i18n/en/directory.ts
// ============================================================

import type { DirectoryDict } from '@/lib/i18n/es/directory'

export const directory = {
  breadcrumbHome: 'Home',
  unitsFallback: 'units',
  clientFallback: 'Customer',

  breadcrumbStores: 'Stores',
  storesPageTitle: 'Stores on MercadoRD',
  activeStoreSingular: 'active store',
  activeStorePlural: 'active stores',
  noStoresYet: 'No stores to show yet.',
  verifiedBadge: 'Verified',
  viewStoreLink: 'View store →',

  providersPageTitle: 'Providers',
  providersPageSubtitle: 'Dominican manufacturers, wholesalers, and distributors — filter by what you need',
  mobileFiltersButton: '⚙️ Filters',
  searchingProviders: 'Searching providers...',
  noProvidersFound: "We couldn't find providers with those filters — try adjusting your search",
  filtersDrawerTitle: 'Filters',
  closeFiltersAria: 'Close filters',
  viewResultsButton: 'View results',

  businessTypeFilterLabel: 'Business type',
  categoryFilterLabel: 'Category',
  provinceFilterLabel: 'Province',
  allProvincesOption: 'All',
  maxMoqFilterLabel: 'Max MOQ',
  maxMoqPlaceholder: 'Show providers with MOQ ≤ X',
  servicesFilterLabel: 'Services',
  minVerificationFilterLabel: 'Minimum verification level',
  anyVerificationOption: 'Any',
  verifiedOrMoreOption: '✓ Verified business or higher',
  manufacturerVerifiedOrMoreOption: '🏭 Verified manufacturer or higher',
  featuredOnlyOption: '⭐ Featured providers only',

  whatsappButton: 'WhatsApp',
  instagramButton: 'Instagram',
  totalSalesLabel: 'Total sales',
  memberSinceLabel: 'Member since ({duration})',
  membershipNew: 'new',
  membershipMonthsSingular: '{count} month ago',
  membershipMonthsPlural: '{count} months ago',
  membershipYearsSingular: '{count} year ago',
  membershipYearsPlural: '{count} years ago',
  providerInfoTitle: 'Provider information',
  categoriesLabel: 'Categories',
  servicesSectionLabel: 'Services',
  manufacturingSpecialtyLabel: 'Manufacturing specialty',
  productionTimeLabel: '⏱️ Production time:',
  privateLabelLabel: '🏷️ Private label?:',
  yesValue: 'Yes',
  noValue: 'No',
  customizationLabel: '🎨 Customization?:',
  minOrderQuantityLabel: 'Minimum order quantity',
  targetCustomersLabel: 'Customers served',
  productsTitle: 'Products',
  noProductsYet: "This store doesn't have any published products yet.",
  recentReviewsTitle: 'Recent reviews',
  noReviewsYet: "This store doesn't have any reviews yet.",
  reviewCountSingular: 'review',
  reviewCountPlural: 'reviews',
} satisfies DirectoryDict
