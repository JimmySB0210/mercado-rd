// ============================================================
// MercadoRD — i18n: namespace "vendorOptions" (Français)
// Ruta: src/lib/i18n/fr/vendorOptions.ts
// ============================================================

import type { VendorOptionsDict } from '@/lib/i18n/es/vendorOptions'

export const vendorOptions = {
  businessType: {
    manufacturer: 'Fabricant',
    wholesaler: 'Grossiste',
    retailer: 'Détaillant',
    importer: 'Importateur',
    distributor: 'Distributeur',
    supplier: 'Fournisseur',
    private_label: 'Marque propre',
    artisan: 'Artisan/Producteur',
    service_provider: 'Prestataire de services',
  },
  manufacturingStatus: {
    fabricates_own: 'Je fabrique mes propres produits',
    buys_from_third_parties: "J'achète auprès de tiers",
    mixed: "Mixte (je fabrique certains, j'achète d'autres)",
  },
  productionTime: {
    under_7_days: 'Moins de 7 jours',
    days_7_15: '7 à 15 jours',
    days_15_30: '15 à 30 jours',
    days_30_60: '30 à 60 jours',
    over_60_days: 'Plus de 60 jours',
    variable: 'Variable, selon la commande',
    custom: 'Personnalisé',
  },
  customerType: {
    end_consumer: 'Consommateur final',
    resellers: 'Revendeurs',
    stores: 'Boutiques',
    businesses: 'Entreprises',
    wholesalers: 'Grossistes',
    retailers: 'Détaillants',
    manufacturers: 'Fabricants',
    entrepreneurs: 'Entrepreneurs',
    distributors: 'Distributeurs',
  },
  customizationOption: {
    yes: 'Oui',
    no: 'Non',
    depends: 'Ça dépend',
  },
  service: {
    manufacturing: 'Fabrication',
    private_label: 'Marque privée',
    product_development: 'Développement de produit',
    formula_development: 'Développement de formule',
    customization: 'Personnalisation',
    packaging: 'Conditionnement',
    labeling: 'Étiquetage',
    on_demand_production: 'Production à la demande',
    product_design: 'Conception de produit',
    national_shipping: 'Livraison nationale',
    delivery: 'Livraison',
    pickup: 'Retrait',
    importing: 'Importation',
    storage: 'Stockage',
    distribution: 'Distribution',
    other: 'Autre',
  },
  serviceGroupTitles: {
    manufacturing_dev: 'Fabrication et développement',
    logistics: 'Logistique et distribution',
  },
  verificationLevel: {
    '1': 'Compte de base',
    '2': 'Entreprise vérifiée',
    '3': 'Fabricant vérifié',
    '4': 'Fournisseur en vedette',
  },
} satisfies VendorOptionsDict
