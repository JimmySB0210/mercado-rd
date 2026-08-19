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
} satisfies ProductsDict
