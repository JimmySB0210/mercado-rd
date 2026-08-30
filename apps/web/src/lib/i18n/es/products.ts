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
  viewStore: 'Ver tienda →',
  askWhatsappShort: 'Preguntar',
  verifiedBadge: 'Verificado',
  cardFreeShipping: 'Envío gratis',
  cardShippingFrom: 'Envío desde RD${amount}',

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
  addedToCart: '✓ Añadido al carrito',
  addToCart: 'Añadir al carrito',

  // FreeShippingBadge
  freeShippingApplied: '🎉 ¡Envío gratis ya aplicado en tu carrito!',
  freeShippingProgress: '🚚 Envío gratis desde RD${threshold} — te faltan RD${amount}',

  // ContactVendorButton
  askVendorButton: 'Preguntar al vendedor',
  openingChat: 'Abriendo chat...',

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

  // HomeProductGrid
  featuredOffersTitle: 'Ofertas destacadas',
  viewAll: 'Ver todas →',
  loadError: 'No pudimos cargar los productos. Intenta recargar la página.',
  loading: 'Cargando...',
  loadMore: 'Ver más productos',
  popularStoresTitle: 'Tiendas populares',
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

  // FeaturedProducts
  featuredProductsTitle: 'Productos destacados ⭐',

  // DailyDeals
  dailyDealsTitle: '⚡ Ofertas del día',

  pricingTiersTitle: 'Precios por cantidad',
  pricingTiersRangeAndUp: '{min}+ {unit}',
  pricingTiersRangeBetween: '{min}-{max} {unit}',

  trustBarTitle: 'Confianza del vendedor',
  trustRatingLine: 'Calificación: {average}/5 ({count})',
  trustResponseLine: 'Tiempo de respuesta: {label}',
  trustOnTimeLine: 'Entregas a tiempo: ≥{rate}%',
  trustResponseUnder1h: '≤1h',
  trustResponseUnder4h: '≤4h',
  trustResponseUnder12h: '≤12h',
  trustResponseUnder24h: '≤24h',
  trustResponse1to2Days: '1-2 días',
  trustResponseOver2Days: '+2 días',
}

export type ProductsDict = typeof products
