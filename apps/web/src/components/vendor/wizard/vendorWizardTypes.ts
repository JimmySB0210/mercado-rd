// ============================================================
// MercadoRD — Estado acumulado del wizard de registro de vendor
// Ruta: src/components/vendor/wizard/vendorWizardTypes.ts
// ============================================================
// Estado elevado (mismo patrón que PromoBannerManager.tsx): vive en
// VendorRegisterWizard.tsx y cada paso recibe la porción que necesita
// + un setter para actualizarla, en vez de manejar su propio estado
// aislado — así el Paso 6 (revisión) puede leer todo lo ingresado.
// ============================================================

import type {
  BusinessType, ManufacturingStatus, ProductionTimeRange, CustomerType,
  VendorService, CustomizationOption, Vendor,
} from '@/types/database.types'

export interface VendorWizardFormData {
  // Paso 1 — Información básica
  businessName: string
  legalName: string
  contactFullName: string
  whatsapp: string
  provinceId: string
  municipio: string
  sector: string
  address: string
  hasPhysicalStore: boolean | null
  hasWarehouse: boolean | null
  hasWorkshop: boolean | null
  // Paso 2 — Tipo de negocio
  businessTypes: BusinessType[]
  // Paso 3 — Qué vende + fabricación
  categoryIds: number[]
  manufacturingStatus: ManufacturingStatus | null
  productionTime: ProductionTimeRange | null
  productionTimeCustom: string
  acceptsPrivateLabel: boolean | null
  allowsCustomization: CustomizationOption | null
  // Paso 4 — Servicios
  services: VendorService[]
  // Paso 5 — A quién vendes + condiciones de compra
  targetCustomers: CustomerType[]
  minOrderQuantity: string
  minOrderUnit: string
}

export function buildInitialWizardData(vendor: Vendor | null): VendorWizardFormData {
  return {
    businessName: vendor?.business_name ?? '',
    legalName: vendor?.legal_name ?? '',
    contactFullName: vendor?.contact_full_name ?? '',
    whatsapp: vendor?.whatsapp ?? '',
    provinceId: vendor?.province_id ? String(vendor.province_id) : '',
    municipio: vendor?.municipio ?? '',
    sector: vendor?.sector ?? '',
    address: vendor?.address ?? '',
    hasPhysicalStore: vendor?.has_physical_store ?? null,
    hasWarehouse: vendor?.has_warehouse ?? null,
    hasWorkshop: vendor?.has_workshop ?? null,
    businessTypes: [],
    categoryIds: [],
    manufacturingStatus: vendor?.manufacturing_status ?? null,
    productionTime: vendor?.production_time ?? null,
    productionTimeCustom: vendor?.production_time_custom ?? '',
    acceptsPrivateLabel: vendor?.accepts_private_label ?? null,
    allowsCustomization: vendor?.allows_customization ?? null,
    services: [],
    targetCustomers: [],
    minOrderQuantity: vendor?.min_order_quantity ? String(vendor.min_order_quantity) : '',
    minOrderUnit: vendor?.min_order_unit ?? 'unidades',
  }
}
