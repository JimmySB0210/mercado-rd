// ============================================================
// MercadoRD — i18n: namespace "directory" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/directory.ts
// ============================================================
// Cubre app/tiendas/page.tsx, app/proveedores/page.tsx,
// app/tienda/[id]/page.tsx, components/providers/ProviderFilters.tsx
// y components/providers/ProviderCard.tsx.
//
// IMPORTANTE: los labels de tipo de negocio, servicios, tiempo de
// producción, personalización, tipo de cliente y nivel de verificación
// YA se traducen vía el namespace "vendorOptions" (t('businessType.*'),
// t('service.*'), t('verificationLevel.*'), etc.) — este namespace NO
// los duplica, solo cubre el resto del texto de estas páginas.
// ============================================================

export const directory = {
  // Genérico (reutilizado en varios archivos de este namespace)
  breadcrumbHome: 'Inicio',
  unitsFallback: 'unidades',
  clientFallback: 'Cliente',

  // app/tiendas/page.tsx
  breadcrumbStores: 'Tiendas',
  storesPageTitle: 'Tiendas en MercadoRD',
  activeStoreSingular: 'tienda activa',
  activeStorePlural: 'tiendas activas',
  noStoresYet: 'Todavía no hay tiendas para mostrar.',
  verifiedBadge: 'Verificado',
  viewStoreLink: 'Ver tienda →',

  // app/proveedores/page.tsx
  providersPageTitle: 'Proveedores',
  providersPageSubtitle: 'Fabricantes, mayoristas y distribuidores dominicanos — filtra por lo que necesitas',
  mobileFiltersButton: '⚙️ Filtros',
  searchingProviders: 'Buscando proveedores...',
  noProvidersFound: 'No encontramos proveedores con esos filtros — prueba ajustando la búsqueda',
  filtersDrawerTitle: 'Filtros',
  closeFiltersAria: 'Cerrar filtros',
  viewResultsButton: 'Ver resultados',

  // components/providers/ProviderFilters.tsx — solo los labels de cada
  // filtro; las opciones dentro de cada uno ya usan vendorOptions
  businessTypeFilterLabel: 'Tipo de negocio',
  categoryFilterLabel: 'Categoría',
  provinceFilterLabel: 'Provincia',
  allProvincesOption: 'Todas',
  maxMoqFilterLabel: 'MOQ máximo',
  maxMoqPlaceholder: 'Mostrar proveedores con MOQ ≤ X',
  servicesFilterLabel: 'Servicios',
  minVerificationFilterLabel: 'Nivel de verificación mínimo',
  anyVerificationOption: 'Cualquiera',
  verifiedOrMoreOption: '✓ Negocio verificado o más',
  manufacturerVerifiedOrMoreOption: '🏭 Fabricante verificado o más',
  featuredOnlyOption: '⭐ Solo proveedores destacados',

  // app/tienda/[id]/page.tsx
  whatsappButton: 'WhatsApp',
  instagramButton: 'Instagram',
  totalSalesLabel: 'Ventas totales',
  memberSinceLabel: 'Miembro desde ({duration})',
  membershipNew: 'nuevo',
  membershipMonthsSingular: 'hace {count} mes',
  membershipMonthsPlural: 'hace {count} meses',
  membershipYearsSingular: 'hace {count} año',
  membershipYearsPlural: 'hace {count} años',
  providerInfoTitle: 'Información del proveedor',
  categoriesLabel: 'Categorías',
  servicesSectionLabel: 'Servicios',
  manufacturingSpecialtyLabel: 'Especialidad de fabricación',
  productionTimeLabel: '⏱️ Tiempo de producción:',
  privateLabelLabel: '🏷️ ¿Marca privada?:',
  yesValue: 'Sí',
  noValue: 'No',
  customizationLabel: '🎨 ¿Personalización?:',
  minOrderQuantityLabel: 'Cantidad mínima de compra',
  targetCustomersLabel: 'Clientes que atiende',
  productsTitle: 'Productos',
  noProductsYet: 'Esta tienda aún no tiene productos publicados.',
  recentReviewsTitle: 'Reseñas recientes',
  noReviewsYet: 'Esta tienda aún no tiene reseñas.',
  reviewCountSingular: 'reseña',
  reviewCountPlural: 'reseñas',
}

export type DirectoryDict = typeof directory
