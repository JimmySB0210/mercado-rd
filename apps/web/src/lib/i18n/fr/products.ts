// ============================================================
// MercadoRD — i18n: namespace "products" (Français)
// Ruta: src/lib/i18n/fr/products.ts
// ============================================================

import type { ProductsDict } from '@/lib/i18n/es/products'

export const products = {
  stockLeftBadge: 'Il en reste {count}',
  viewStore: 'Voir la boutique →',
  askWhatsappShort: 'Demander',
  verifiedBadge: 'Vérifié',
  cardFreeShipping: 'Livraison gratuite',
  cardShippingFrom: 'Livraison dès RD${amount}',

  sizeLabel: 'Taille',
  colorLabel: 'Couleur',
  quantityLabel: 'Quantité',
  outOfStock: 'Épuisé',
  noStock: 'Épuisé',
  stockAvailable: 'Stock : {count} disponibles',
  selectSize: 'Choisissez une taille',
  selectSizePlaceholder: 'Choisissez une taille',
  selectColor: 'Choisissez une couleur',
  selectOption: 'Choisissez une option',
  addedToCart: '✓ Ajouté au panier',
  addToCart: 'Ajouter au panier',

  freeShippingApplied: '🎉 Livraison gratuite déjà appliquée à votre panier !',
  freeShippingProgress: '🚚 Livraison gratuite dès RD${threshold} — il vous manque RD${amount}',

  askVendorButton: 'Demander au vendeur',
  openingChat: 'Ouverture du chat...',

  relatedProductsTitle: 'Vous pourriez aussi aimer',

  breadcrumbHome: 'Accueil',
  reviewsSuffix: 'avis',
  soldSuffix: 'vendus',
  salesSuffix: 'ventes',
  itbisIncluded: 'ITBIS inclus (18 %) : {amount}',
  totalLabel: 'Total : {amount}',
  lowStockWarning: '⚡ Il ne reste que {count} unités',
  inStockAvailable: '✓ En stock ({count} disponibles)',
  askWhatsapp: 'Demander via WhatsApp',
  descriptionHeading: 'Description',
  specsHeading: 'Caractéristiques',
  specYes: 'Oui',
  specNo: 'Non',
  vendorHeading: 'Vendeur',

  featuredOffersTitle: 'Offres en vedette',
  viewAll: 'Voir tout →',
  loadError: "Nous n'avons pas pu charger les produits. Essayez de recharger la page.",
  loading: 'Chargement...',
  loadMore: 'Voir plus de produits',
  popularStoresTitle: 'Boutiques populaires',
  featuredProvidersTitle: 'Fournisseurs en vedette',
  exploreCategoriesTitle: 'Explorer par catégorie',
  moreCategoriesLabel: 'Plus de catégories',
  trustSecureTitle: 'Achat 100 % sécurisé',
  trustSecureSub: 'Nous protégeons votre argent',
  trustBuyersTitle: 'Des milliers d\'acheteurs',
  trustBuyersSub: 'Nous font confiance',
  trustQualityTitle: 'Produits de qualité',
  trustQualitySub: 'Vérifiés',
  trustShippingTitle: '+32 provinces',
  trustShippingSub: 'Livraison dans tout le pays',

  featuredProductsTitle: 'Produits en vedette ⭐',

  dailyDealsTitle: '⚡ Offres du jour',

  pricingTiersTitle: 'Prix par quantité',
  pricingTiersRangeAndUp: '{min}+ {unit}',
  pricingTiersRangeBetween: '{min}-{max} {unit}',

  trustBarTitle: 'Confiance du vendeur',
  trustRatingLine: 'Note : {average}/5 ({count})',
  trustResponseLine: 'Temps de réponse : {label}',
  trustOnTimeLine: 'Livraisons à temps : ≥{rate}%',
  trustResponseUnder1h: '≤1h',
  trustResponseUnder4h: '≤4h',
  trustResponseUnder12h: '≤12h',
  trustResponseUnder24h: '≤24h',
  trustResponse1to2Days: '1-2 jours',
  trustResponseOver2Days: '+2 jours',
} satisfies ProductsDict
