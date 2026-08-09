// ============================================================
// MercadoRD — i18n: namespace "categories" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/categories.ts
// ============================================================
// Texto de app/categorias/page.tsx y app/categoria/[slug]/page.tsx.
// Claves con {variable} soportan interpolación vía t(key, params) —
// ver lib/hooks/useTranslation.ts.
// ============================================================

export const categories = {
  // /categorias — índice de todas las categorías
  breadcrumbHome: 'Inicio',
  breadcrumbCurrent: 'Categorías',
  pageTitle: 'Todas las categorías',
  categoryCountOne: '{count} categoría',
  categoryCountOther: '{count} categorías',
  noCategoriesEmptyState: 'Todavía no hay categorías para mostrar.',

  // /categoria/[slug] — productos de una categoría
  defaultCategoryTitle: 'Todos los productos',
  productsFoundCount: '{count} productos encontrados',
  noProductsEmptyState: 'Todavía no hay productos en esta categoría.',
  backToHome: 'Volver al inicio',
}

export type CategoriesDict = typeof categories
