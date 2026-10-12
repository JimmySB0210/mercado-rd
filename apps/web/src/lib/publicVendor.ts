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

import type { CustomizationOption, ProductionTimeRange } from '@/types/database.types'

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
