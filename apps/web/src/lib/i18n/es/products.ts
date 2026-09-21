// ============================================================
// MercadoRD — i18n: namespace "products" (español, fuente de verdad)
// Ruta: src/lib/i18n/es/products.ts
// ============================================================
// Texto de ProductCard, ProductActions, FreeShippingBadge,
// ContactVendorButton, RelatedProducts, producto/[id], HomeProductGrid
// y FeaturedProducts. Claves con {variable} soportan interpolación
// vía t(key, params) — ver lib/hooks/useTranslation.ts.
// ============================================================

export const products = {
  // ProductCard
  stockLeftBadge: 'Quedan {count}',
  newBadge: 'Nuevo',
  bestSellerBadge: 'Más vendido',
  localBadge: 'Local',
  viewStore: 'Ver tienda →',
  viewOptionsCta: 'Ver opciones →',
  askWhatsappShort: 'Preguntar',
  verifiedBadge: 'Verificado',
  cardFreeShipping: 'Envío gratis',
  cardShippingFrom: 'Envío desde RD${amount}',
  cardNoRatingsYet: 'Sin reseñas todavía',

  // ProductActions
  sizeLabel: 'Talla',
  colorLabel: 'Color',
  quantityLabel: 'Cantidad',
  outOfStock: 'Agotado',
  noStock: 'Sin stock',
  stockAvailable: 'Stock: {count} disponibles',
  selectSize: 'Selecciona talla',
  selectSizePlaceholder: 'Selecciona una talla',
  selectColor: 'Selecciona color',
  selectOption: 'Selecciona una opción',
  addedToCart: '✓ Agregado al carrito',
  addToCart: 'Agregar al carrito',

  // FreeShippingBadge
  freeShippingApplied: '🎉 ¡Envío gratis ya aplicado en tu carrito!',
  freeShippingProgress: '🚚 Envío gratis desde RD${threshold} — te faltan RD${amount}',

  // ContactVendorButton
  askVendorButton: 'Preguntar al vendedor',
  openingChat: 'Abriendo chat...',

  // GiftListButton
  addToGiftListButton: '🎁 Agregar a mi lista de regalos',
  addingToGiftList: 'Agregando...',
  choosePriorityLabel: '¿Qué tan importante es este regalo?',
  giftPriorityHigh: 'Alta',
  giftPriorityMedium: 'Media',
  giftPriorityLow: 'Baja',
  addedToGiftListButton: '✓ En tu lista de regalos',

  // RelatedProducts
  relatedProductsTitle: 'También te puede interesar',

  // producto/[id]/page.tsx
  breadcrumbHome: 'Inicio',
  reviewsSuffix: 'reseñas',
  soldSuffix: 'vendidos',
  salesSuffix: 'ventas',
  itbisIncluded: 'ITBIS incluido (18%): {amount}',
  totalLabel: 'Total: {amount}',
  lowStockWarning: '⚡ Solo quedan {count} unidades',
  inStockAvailable: '✓ En stock ({count} disponibles)',
  askWhatsapp: 'Preguntar por WhatsApp',
  descriptionHeading: 'Descripción',
  specsHeading: 'Especificaciones',
  specYes: 'Sí',
  specNo: 'No',
  vendorHeading: 'Vendedor',

  // SearchFiltersBar (buscar/page.tsx)
  filterAllCategories: 'Todas las categorías',
  filterAllProvinces: 'Toda RD',
  filterMinPricePlaceholder: 'Mín',
  filterMaxPricePlaceholder: 'Máx',
  filterAnyRating: 'Cualquier calificación',
  filterAnyReviews: 'Cualquier cantidad de reseñas',
  filterVerifiedOnlyLabel: 'Solo verificados ✓',
  sortRelevance: 'Relevancia',
  sortPriceAsc: 'Precio: menor a mayor',
  sortPriceDesc: 'Precio: mayor a menor',
  sortRating: 'Mejor calificados',
  sortNewest: 'Más nuevos',
  sortSales: 'Más vendidos',
  sortPopularity: 'Más populares',

  // HomeProductGrid
  featuredOffersTitle: 'Ofertas destacadas',
  recentlyPublishedTitle: 'Recién publicados',
  bestSellersTitle: 'Más vendidos',
  lowStockTitle: 'Últimas unidades',
  recentActivityHeading: '🟢 Actividad reciente',
  recentActivityLine: '🔥 {quantity} {productName} vendidas en las últimas horas',
  trendingTitle: '📈 Tendencias',
  popularTitle: '👀 Populares',
  nearbyTitle: '📍 Cerca de ti',
  viewAll: 'Ver todas →',
  loadError: 'No pudimos cargar los productos. Intenta recargar la página.',
  loading: 'Cargando...',
  loadMore: 'Ver más productos',
  popularStoresTitle: 'Tiendas destacadas',
  popularStoresSubtitle: 'Descubre tiendas confiables en toda República Dominicana.',
  featuredProvidersTitle: 'Proveedores destacados',
  exploreCategoriesTitle: 'Explora por categoría',
  moreCategoriesLabel: 'Más categorías',
  trustSecureTitle: 'Compra 100% segura',
  trustSecureSub: 'Protegemos tu dinero',
  trustBuyersTitle: 'Miles de compradores',
  trustBuyersSub: 'Confían en nosotros',
  trustQualityTitle: 'Productos de calidad',
  trustQualitySub: 'Verificados',
  trustShippingTitle: '+32 provincias',
  trustShippingSub: 'Envíos a todo el país',

  // FeaturedProducts — is_featured es una curaduría manual (vendor/admin),
  // no un ranking por búsquedas ni vistas, así que el subtítulo no puede
  // decir "los más buscados" sin inventar un dato que no existe.
  featuredProductsTitle: 'Productos destacados ⭐',
  featuredProductsSubtitle: 'Una selección especial de productos para ti.',

  // DailyDeals — get_daily_deals() sí filtra por % de descuento real
  dailyDealsTitle: '⚡ Ofertas del día',
  dailyDealsSubtitle: 'Descuentos por tiempo limitado en productos seleccionados.',
  viewOffersCta: 'Ver ofertas →',

  // 3 banners promocionales (home), justo debajo de "Productos
  // destacados" — vendedores / envíos / ofertas, mismo trío que pide la
  // referencia visual.
  sellerCtaTitle: 'Vende tus productos\nen MercadoRD',
  sellerCtaSubtitle: 'Llega a miles de compradores\nen toda la República Dominicana.',
  sellerCtaButton: 'Comenzar a vender →',
  shippingCardTitle: 'Envíos confiables\ny rápidos',
  shippingCardSubtitle: 'Tus productos llegan seguros\na cualquier parte del país.',
  moreInfoCta: 'Más información →',
  offersCardTitle: 'Ofertas especiales',
  offersCardSubtitle: 'Los mejores precios en\ntecnología, moda y más.',

  pricingTiersTitle: 'Precios por cantidad',
  pricingTiersRangeAndUp: '{min}+ {unit}',
  pricingTiersRangeBetween: '{min}-{max} {unit}',

  trustBarTitle: 'Confianza del vendedor',
  trustRatingLabel: 'Calificación',
  trustResponseLabel: 'Respuesta',
  trustOnTimeLabel: 'A tiempo',
  trustResponseUnder1h: '≤1h',
  trustResponseUnder4h: '≤4h',
  trustResponseUnder12h: '≤12h',
  trustResponseUnder24h: '≤24h',
  trustResponse1to2Days: '1-2 días',
  trustResponseOver2Days: '+2 días',

  reviewsHeading: 'Reseñas',
  defaultReviewerName: 'Cliente',
  verifiedPurchaseBadge: '✓ Compra verificada',
  noReviewsYet: 'Aún no hay reseñas para este producto.',
  showMoreReviewsButton: 'Ver más reseñas',
  faqPublicHeading: 'Preguntas frecuentes',
  businessTypeQuestion: '¿Qué tipo de negocio es {vendorName}?',
}

export type ProductsDict = typeof products
