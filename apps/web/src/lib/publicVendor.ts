// ============================================================
// MercadoRD — Datos públicos de una tienda
// Ruta: src/lib/publicVendor.ts
// ============================================================
// search_providers devuelve SELECT v.* (todas las columnas de vendors,
// también bank_account, rnc, legal_name, address, latitude/longitude y
// user_id). Los componentes nunca reciben esa fila: toPublicVendorCard
// es el único punto que la convierte en un PublicVendorCard con solo
// los campos que se pueden mostrar.
//
// Insignias: una lista, no un booleano. Hoy solo puede traer la del
// nivel de verificación (2-4, que solo cambia un admin). Cuando exista
// un proveedor de verificación real, external_verifications
// (status = 'verified') podrá añadir 'rnc' o 'identity' aquí sin
// rediseñar la tarjeta. Nunca se derivan de plan, rnc ni del perfil
// completo.
// ============================================================

import type { CustomizationOption, ManufacturingStatus, ProductionTimeRange } from '@/types/database.types'

export type PublicVendorBadge =
  | { kind: 'verification_level'; level: 2 | 3 | 4 }

export interface PublicVendorCard {
  id: string
  businessName: string
  logoUrl: string | null
  provinceId: number | null
  municipio: string | null
  categoryId: number | null
  createdAt: string
  minOrderQuantity: number | null
  minOrderUnit: string | null
  productionTime: ProductionTimeRange | null
  productionTimeCustom: string | null
  acceptsPrivateLabel: boolean | null
  allowsCustomization: CustomizationOption | null
  badges: PublicVendorBadge[]
}

// Fila de vendors o de search_providers: solo se leen estos campos.
interface VendorRowLike {
  id: string
  business_name: string
  logo_url: string | null
  province_id: number | null
  municipio: string | null
  category_id: number | null
  created_at: string
  min_order_quantity: number | null
  min_order_unit: string | null
  production_time: ProductionTimeRange | null
  production_time_custom: string | null
  accepts_private_label: boolean | null
  allows_customization: CustomizationOption | null
  verification_level: number | null
}

export function verificationBadges(level: number | null): PublicVendorBadge[] {
  if (level === 2 || level === 3 || level === 4) return [{ kind: 'verification_level', level }]
  return []
}

export function toPublicVendorCard(row: VendorRowLike): PublicVendorCard {
  return {
    id: row.id,
    businessName: row.business_name,
    logoUrl: row.logo_url,
    provinceId: row.province_id,
    municipio: row.municipio?.trim() || null,
    categoryId: row.category_id,
    createdAt: row.created_at,
    minOrderQuantity: row.min_order_quantity,
    minOrderUnit: row.min_order_unit,
    productionTime: row.production_time,
    productionTimeCustom: row.production_time_custom,
    acceptsPrivateLabel: row.accepts_private_label,
    allowsCustomization: row.allows_customization,
    badges: verificationBadges(row.verification_level),
  }
}

// Envíos: se derivan de los servicios declarados, en este orden.
export const SHIPPING_SERVICES = ['national_shipping', 'delivery', 'pickup'] as const

export function vendorInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w))
  const letters = words.slice(0, 2).map(w => [...w].find(c => /[\p{L}\p{N}]/u.test(c)) ?? '')
  return letters.join('').toUpperCase() || '?'
}

// ─── Perfil de tienda (/tienda/[id] y paso 9 del asistente) ──────────
// tienda/[id]/page.tsx y lib/queries/vendorStorePreviewClient.ts siguen
// siendo dos consultas (servidor y navegador), pero piden exactamente
// estas columnas y pasan por el mismo mapper. Nunca bank_*, rnc,
// legal_name, contact_full_name, latitude, longitude, address ni
// user_id. La dirección llega aparte, de get_vendor_store_address (que
// solo la devuelve con tienda física), y el mapper repite esa regla
// como doble control.

export const VENDOR_PROFILE_SELECT =
  'id, business_name, logo_url, description, municipio, sector, created_at, whatsapp, instagram, ' +
  'verification_level, is_verified, min_order_quantity, min_order_unit, production_time, production_time_custom, ' +
  'manufacturing_status, accepts_private_label, allows_customization, has_physical_store, has_warehouse, has_workshop, ' +
  'province:provinces_rd(name), category:categories(id, name, name_en, name_fr, emoji, slug)'

export interface PublicCategory { id: number; name: string; name_en: string; name_fr: string; emoji: string; slug: string }

export interface PublicVendorProfile {
  id: string
  businessName: string
  logoUrl: string | null
  description: string | null
  provinceName: string | null
  municipio: string | null
  sector: string | null
  physicalStoreAddress: string | null
  mainCategory: PublicCategory | null
  createdAt: string
  whatsapp: string | null
  instagram: string | null
  isVerified: boolean
  minOrderQuantity: number | null
  minOrderUnit: string | null
  productionTime: ProductionTimeRange | null
  productionTimeCustom: string | null
  manufacturingStatus: ManufacturingStatus | null
  acceptsPrivateLabel: boolean | null
  allowsCustomization: CustomizationOption | null
  hasPhysicalStore: boolean | null
  hasWarehouse: boolean | null
  hasWorkshop: boolean | null
  badges: PublicVendorBadge[]
}

interface VendorProfileRow {
  id: string
  business_name: string
  logo_url: string | null
  description: string | null
  municipio: string | null
  sector: string | null
  created_at: string
  whatsapp: string | null
  instagram: string | null
  verification_level: number | null
  is_verified: boolean | null
  min_order_quantity: number | null
  min_order_unit: string | null
  production_time: ProductionTimeRange | null
  production_time_custom: string | null
  manufacturing_status: ManufacturingStatus | null
  accepts_private_label: boolean | null
  allows_customization: CustomizationOption | null
  has_physical_store: boolean | null
  has_warehouse: boolean | null
  has_workshop: boolean | null
  province: { name: string } | null
  category: PublicCategory | null
}

export function toPublicVendorProfile(row: VendorProfileRow, storeAddress: string | null): PublicVendorProfile {
  return {
    id: row.id,
    businessName: row.business_name,
    logoUrl: row.logo_url,
    description: row.description?.trim() || null,
    provinceName: row.province?.name ?? null,
    municipio: row.municipio?.trim() || null,
    sector: row.sector?.trim() || null,
    physicalStoreAddress: row.has_physical_store === true ? storeAddress?.trim() || null : null,
    mainCategory: row.category ?? null,
    createdAt: row.created_at,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    isVerified: !!row.is_verified,
    minOrderQuantity: row.min_order_quantity,
    minOrderUnit: row.min_order_unit,
    productionTime: row.production_time,
    productionTimeCustom: row.production_time_custom,
    manufacturingStatus: row.manufacturing_status,
    acceptsPrivateLabel: row.accepts_private_label,
    allowsCustomization: row.allows_customization,
    hasPhysicalStore: row.has_physical_store,
    hasWarehouse: row.has_warehouse,
    hasWorkshop: row.has_workshop,
    badges: verificationBadges(row.verification_level),
  }
}
