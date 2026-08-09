// ============================================================
// MercadoRD — Opciones y labels del wizard de registro de vendor
// Archivo: lib/vendorWizardOptions.ts
// ============================================================

import type {
  BusinessType,
  ManufacturingStatus,
  ProductionTimeRange,
  CustomerType,
  VendorService,
  CustomizationOption,
} from '@/types/database.types'

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'manufacturer',      label: 'Fabricante' },
  { value: 'wholesaler',        label: 'Mayorista' },
  { value: 'retailer',          label: 'Minorista' },
  { value: 'importer',          label: 'Importador' },
  { value: 'distributor',       label: 'Distribuidor' },
  { value: 'supplier',          label: 'Proveedor' },
  { value: 'private_label',     label: 'Marca propia' },
  { value: 'artisan',           label: 'Artesano/Productor' },
  { value: 'service_provider',  label: 'Prestador de servicios' },
]

export const MANUFACTURING_STATUS_OPTIONS: { value: ManufacturingStatus; label: string }[] = [
  { value: 'fabricates_own',          label: 'Fabrico mis productos' },
  { value: 'buys_from_third_parties', label: 'Compro a terceros' },
  { value: 'mixed',                   label: 'Mixto (fabrico algunos, compro otros)' },
]

export const PRODUCTION_TIME_OPTIONS: { value: ProductionTimeRange; label: string }[] = [
  { value: 'under_7_days', label: 'Menos de 7 días' },
  { value: 'days_7_15',    label: '7 a 15 días' },
  { value: 'days_15_30',   label: '15 a 30 días' },
  { value: 'days_30_60',   label: '30 a 60 días' },
  { value: 'over_60_days', label: 'Más de 60 días' },
  { value: 'variable',     label: 'Variable, según el pedido' },
  { value: 'custom',       label: 'Personalizado' },
]

export const CUSTOMER_TYPE_OPTIONS: { value: CustomerType; label: string }[] = [
  { value: 'end_consumer',  label: 'Consumidor final' },
  { value: 'resellers',     label: 'Revendedores' },
  { value: 'stores',        label: 'Tiendas' },
  { value: 'businesses',    label: 'Negocios' },
  { value: 'wholesalers',   label: 'Mayoristas' },
  { value: 'retailers',     label: 'Minoristas' },
  { value: 'manufacturers', label: 'Fabricantes' },
  { value: 'entrepreneurs', label: 'Emprendedores' },
  { value: 'distributors',  label: 'Distribuidores' },
]

export const CUSTOMIZATION_OPTION_LABELS: Record<CustomizationOption, string> = {
  yes: 'Sí',
  no: 'No',
  depends: 'Depende',
}

// Paso 4 — agrupados en 2 secciones visuales
export const VENDOR_SERVICE_GROUPS: { title: string; options: { value: VendorService; label: string }[] }[] = [
  {
    title: 'Fabricación y desarrollo',
    options: [
      { value: 'manufacturing',        label: 'Fabricación' },
      { value: 'private_label',        label: 'Marca privada' },
      { value: 'product_development',  label: 'Desarrollo de producto' },
      { value: 'formula_development',  label: 'Desarrollo de fórmula' },
      { value: 'customization',        label: 'Personalización' },
      { value: 'packaging',            label: 'Envasado' },
      { value: 'labeling',             label: 'Etiquetado' },
      { value: 'on_demand_production', label: 'Producción por encargo' },
      { value: 'product_design',       label: 'Diseño de producto' },
      { value: 'other',                label: 'Otro' },
    ],
  },
  {
    title: 'Logística y distribución',
    options: [
      { value: 'national_shipping', label: 'Envíos nacionales' },
      { value: 'delivery',          label: 'Delivery' },
      { value: 'pickup',            label: 'Pickup' },
      { value: 'importing',         label: 'Importación' },
      { value: 'storage',           label: 'Almacenamiento' },
      { value: 'distribution',      label: 'Distribución' },
    ],
  },
]

export const MIN_ORDER_QUANTITY_OPTIONS = [1, 6, 12, 24, 50, 100, 500, 1000]
