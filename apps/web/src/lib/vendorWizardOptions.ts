// ============================================================
// MercadoRD — Opciones del wizard de registro de vendor
// Archivo: lib/vendorWizardOptions.ts
// ============================================================
// Solo los `value` reales de cada enum — nunca texto traducible.
// Los labels visibles viven en lib/i18n/{es,en,fr}/vendorOptions.ts
// (namespace de traducción 'vendorOptions'), buscados por value vía
// useTranslation('vendorOptions').
// ============================================================

import type {
  BusinessType,
  ManufacturingStatus,
  ProductionTimeRange,
  CustomerType,
  VendorService,
} from '@/types/database.types'

export const BUSINESS_TYPE_OPTIONS: BusinessType[] = [
  'manufacturer', 'wholesaler', 'retailer', 'importer', 'distributor',
  'supplier', 'private_label', 'artisan', 'service_provider',
]

export const MANUFACTURING_STATUS_OPTIONS: ManufacturingStatus[] = [
  'fabricates_own', 'buys_from_third_parties', 'mixed',
]

export const PRODUCTION_TIME_OPTIONS: ProductionTimeRange[] = [
  'under_7_days', 'days_7_15', 'days_15_30', 'days_30_60', 'over_60_days', 'variable', 'custom',
]

export const CUSTOMER_TYPE_OPTIONS: CustomerType[] = [
  'end_consumer', 'resellers', 'stores', 'businesses', 'wholesalers',
  'retailers', 'manufacturers', 'entrepreneurs', 'distributors',
]

// Paso 4 — agrupados en 2 secciones visuales. El título de cada grupo
// vive en vendorOptions.serviceGroupTitles[titleKey].
export const VENDOR_SERVICE_GROUPS: { titleKey: 'manufacturing_dev' | 'logistics'; options: VendorService[] }[] = [
  {
    titleKey: 'manufacturing_dev',
    options: [
      'manufacturing', 'private_label', 'product_development', 'formula_development',
      'customization', 'packaging', 'labeling', 'on_demand_production', 'product_design', 'other',
    ],
  },
  {
    titleKey: 'logistics',
    options: ['national_shipping', 'delivery', 'pickup', 'importing', 'storage', 'distribution'],
  },
]

export const MIN_ORDER_QUANTITY_OPTIONS = [1, 6, 12, 24, 50, 100, 500, 1000]
