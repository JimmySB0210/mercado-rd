// ============================================================
// MercadoRD — i18n: namespace "vendorOptions" (English)
// Ruta: src/lib/i18n/en/vendorOptions.ts
// ============================================================

import type { VendorOptionsDict } from '@/lib/i18n/es/vendorOptions'

export const vendorOptions = {
  businessType: {
    manufacturer: 'Manufacturer',
    wholesaler: 'Wholesaler',
    retailer: 'Retailer',
    importer: 'Importer',
    distributor: 'Distributor',
    supplier: 'Supplier',
    private_label: 'Private label',
    artisan: 'Artisan/Maker',
    service_provider: 'Service provider',
  },
  manufacturingStatus: {
    fabricates_own: 'I make my own products',
    buys_from_third_parties: 'I buy from third parties',
    mixed: 'Mixed (I make some, buy others)',
  },
  productionTime: {
    under_7_days: 'Under 7 days',
    days_7_15: '7 to 15 days',
    days_15_30: '15 to 30 days',
    days_30_60: '30 to 60 days',
    over_60_days: 'Over 60 days',
    variable: 'Variable, depends on the order',
    custom: 'Custom',
  },
  customerType: {
    end_consumer: 'End consumer',
    resellers: 'Resellers',
    stores: 'Stores',
    businesses: 'Businesses',
    wholesalers: 'Wholesalers',
    retailers: 'Retailers',
    manufacturers: 'Manufacturers',
    entrepreneurs: 'Entrepreneurs',
    distributors: 'Distributors',
  },
  customizationOption: {
    yes: 'Yes',
    no: 'No',
    depends: 'Depends',
  },
  service: {
    manufacturing: 'Manufacturing',
    private_label: 'Private label',
    product_development: 'Product development',
    formula_development: 'Formula development',
    customization: 'Customization',
    packaging: 'Packaging',
    labeling: 'Labeling',
    on_demand_production: 'On-demand production',
    product_design: 'Product design',
    national_shipping: 'Nationwide shipping',
    delivery: 'Delivery',
    pickup: 'Pickup',
    importing: 'Importing',
    storage: 'Storage',
    distribution: 'Distribution',
    other: 'Other',
  },
  serviceGroupTitles: {
    manufacturing_dev: 'Manufacturing and development',
    logistics: 'Logistics and distribution',
  },
  verificationLevel: {
    '1': 'Basic account',
    '2': 'Verified business',
    '3': 'Verified manufacturer',
    '4': 'Featured provider',
  },
} satisfies VendorOptionsDict
