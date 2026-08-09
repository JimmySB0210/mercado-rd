// ============================================================
// MercadoRD — Mapas de labels en español para datos del vendor
// Archivo: lib/vendorLabels.ts
// ============================================================
// Compartido entre /tienda/[id] y /proveedores — una sola fuente de
// verdad para traducir los valores de enum a texto visible.
// ============================================================

import {
  BUSINESS_TYPE_OPTIONS, CUSTOMER_TYPE_OPTIONS, PRODUCTION_TIME_OPTIONS, VENDOR_SERVICE_GROUPS,
} from '@/lib/vendorWizardOptions'

export const BUSINESS_TYPE_LABELS: Record<string, string> =
  Object.fromEntries(BUSINESS_TYPE_OPTIONS.map(o => [o.value, o.label]))

export const CUSTOMER_TYPE_LABELS: Record<string, string> =
  Object.fromEntries(CUSTOMER_TYPE_OPTIONS.map(o => [o.value, o.label]))

export const PRODUCTION_TIME_LABELS: Record<string, string> =
  Object.fromEntries(PRODUCTION_TIME_OPTIONS.map(o => [o.value, o.label]))

export const SERVICE_LABELS: Record<string, string> =
  Object.fromEntries(VENDOR_SERVICE_GROUPS.flatMap(g => g.options).map(o => [o.value, o.label]))

// verification_level: 1 = sin badge, 2-4 = niveles crecientes de confianza
export const VERIFICATION_BADGES: Record<number, { label: string; bg: string; text: string }> = {
  2: { label: '✓ Negocio verificado', bg: 'bg-blue-50', text: 'text-blue-600' },
  3: { label: '🏭 Fabricante verificado', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  4: { label: '⭐ Proveedor destacado', bg: 'bg-amber-50', text: 'text-amber-700' },
}
