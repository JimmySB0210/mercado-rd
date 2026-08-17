// ============================================================
// MercadoRD — i18n: namespace "categories" (Français)
// Ruta: src/lib/i18n/fr/categories.ts
// ============================================================

import type { CategoriesDict } from '@/lib/i18n/es/categories'

export const categories = {
  breadcrumbHome: 'Accueil',
  breadcrumbCurrent: 'Catégories',
  pageTitle: 'Toutes les catégories',
  categoryCountOne: '{count} catégorie',
  categoryCountOther: '{count} catégories',
  noCategoriesEmptyState: 'Aucune catégorie à afficher pour le moment.',
  storeCountOne: '{count} boutique',
  storeCountOther: '{count} boutiques',

  defaultCategoryTitle: 'Tous les produits',
  productsFoundCount: '{count} produits trouvés',
  noProductsEmptyState: 'Aucun produit dans cette catégorie pour le moment.',
  backToHome: "Retour à l'accueil",
} satisfies CategoriesDict
