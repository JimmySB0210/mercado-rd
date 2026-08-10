// ============================================================
// MercadoRD — i18n: namespace "cart" (Français)
// Ruta: src/lib/i18n/fr/cart.ts
// ============================================================

import type { CartDict } from '@/lib/i18n/es/cart'

export const cart = {
  cartTitle: 'Votre panier ({count})',
  emptyCart: 'Votre panier est vide',
  exploreProducts: 'Explorer les produits',
  removeItem: 'Supprimer',

  orderSummary: 'Résumé de la commande',
  subtotalLabel: 'Sous-total ({count} articles)',
  freeShippingMissing: 'Plus que RD${amount} pour la livraison gratuite 🚚',
  freeShippingApplied: 'Livraison gratuite appliquée ! 🎉',
  shippingLabel: 'Livraison',
  freeBadge: 'GRATUIT 🎉',
  itbisLabel: 'ITBIS (18 %)',
  totalLabel: 'Total',

  proceedToCheckout: 'Passer la commande',
  continueShopping: '← Continuer mes achats',

  protectedPurchaseTitle: 'Achat protégé',
  protectedPurchaseSub: "Si le produit n'arrive pas, nous vous remboursons",

  paymentTransfer: '🏧 Virement bancaire',
  paymentCash: '💵 Espèces',
} satisfies CartDict
