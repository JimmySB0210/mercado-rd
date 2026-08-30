// ============================================================
// MercadoRD — i18n: namespace "products" (English)
// Ruta: src/lib/i18n/en/products.ts
// ============================================================

import type { ProductsDict } from '@/lib/i18n/es/products'

export const products = {
  stockLeftBadge: '{count} left',
  viewStore: 'View store →',
  askWhatsappShort: 'Ask',
  verifiedBadge: 'Verified',
  cardFreeShipping: 'Free shipping',
  cardShippingFrom: 'Shipping from RD${amount}',

  sizeLabel: 'Size',
  colorLabel: 'Color',
  quantityLabel: 'Quantity',
  outOfStock: 'Out of stock',
  noStock: 'Out of stock',
  stockAvailable: 'Stock: {count} available',
  selectSize: 'Select a size',
  selectSizePlaceholder: 'Select a size',
  selectColor: 'Select a color',
  selectOption: 'Select an option',
  addedToCart: '✓ Added to cart',
  addToCart: 'Add to cart',

  freeShippingApplied: '🎉 Free shipping already applied to your cart!',
  freeShippingProgress: '🚚 Free shipping from RD${threshold} — RD${amount} to go',

  askVendorButton: 'Ask the seller',
  openingChat: 'Opening chat...',

  relatedProductsTitle: 'You might also like',

  breadcrumbHome: 'Home',
  reviewsSuffix: 'reviews',
  soldSuffix: 'sold',
  salesSuffix: 'sales',
  itbisIncluded: 'ITBIS included (18%): {amount}',
  totalLabel: 'Total: {amount}',
  lowStockWarning: '⚡ Only {count} units left',
  inStockAvailable: '✓ In stock ({count} available)',
  askWhatsapp: 'Ask via WhatsApp',
  descriptionHeading: 'Description',
  specsHeading: 'Specifications',
  specYes: 'Yes',
  specNo: 'No',
  vendorHeading: 'Seller',

  featuredOffersTitle: 'Featured deals',
  viewAll: 'View all →',
  loadError: "We couldn't load the products. Try reloading the page.",
  loading: 'Loading...',
  loadMore: 'Load more products',
  popularStoresTitle: 'Popular stores',
  featuredProvidersTitle: 'Featured providers',
  exploreCategoriesTitle: 'Explore by category',
  moreCategoriesLabel: 'More categories',
  trustSecureTitle: '100% secure checkout',
  trustSecureSub: 'We protect your money',
  trustBuyersTitle: 'Thousands of buyers',
  trustBuyersSub: 'Trust us',
  trustQualityTitle: 'Quality products',
  trustQualitySub: 'Verified',
  trustShippingTitle: '+32 provinces',
  trustShippingSub: 'Nationwide shipping',

  featuredProductsTitle: 'Featured products ⭐',

  dailyDealsTitle: '⚡ Deals of the day',

  pricingTiersTitle: 'Quantity pricing',
  pricingTiersRangeAndUp: '{min}+ {unit}',
  pricingTiersRangeBetween: '{min}-{max} {unit}',

  trustBarTitle: 'Seller trust',
  trustRatingLine: 'Rating: {average}/5 ({count})',
  trustResponseLine: 'Response time: {label}',
  trustOnTimeLine: 'On-time deliveries: ≥{rate}%',
  trustResponseUnder1h: '≤1h',
  trustResponseUnder4h: '≤4h',
  trustResponseUnder12h: '≤12h',
  trustResponseUnder24h: '≤24h',
  trustResponse1to2Days: '1-2 days',
  trustResponseOver2Days: '+2 days',

  reviewsHeading: 'Reviews',
  defaultReviewerName: 'Customer',
  verifiedPurchaseBadge: '✓ Verified purchase',
  noReviewsYet: 'No reviews yet for this product.',
  showMoreReviewsButton: 'Show more reviews',
  faqPublicHeading: 'Frequently asked questions',
  businessTypeQuestion: 'What type of business is {vendorName}?',
} satisfies ProductsDict
