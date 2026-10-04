// ============================================================
// MercadoRD — Completitud del perfil de tienda
// Ruta: src/lib/vendorCompleteness.ts
// ============================================================
// 8 checks binarios, 12.5% cada uno — mismo espíritu que "Calidad del
// anuncio" (producto), a nivel tienda completa. Confirmados contra el
// schema real de vendors + tablas relacionadas, 2026-10-01.
//
// A propósito NO incluye: business_name/province_id (obligatorios en
// el registro, nunca estarían vacíos — no diferencian nada) ni los
// campos específicos de fabricante/mayorista (manufacturing_status,
// min_order_quantity, production_time, has_workshop, etc. —
// penalizarían a un retailer normal que nunca debería llenarlos).
// onboarding_completed tampoco es un input: es un gate de registro
// único, no refleja el estado ACTUAL del perfil (un vendor puede
// completar el registro y después vaciar su logo).
// ============================================================

export interface VendorCompletenessInputs {
  hasLogo: boolean
  hasDescription: boolean
  hasContactChannel: boolean // whatsapp O instagram
  hasCategories: boolean // vendor_categories, ≥1 fila
  hasBusinessType: boolean // vendor_business_types, ≥1 fila
  hasServices: boolean // vendor_services, ≥1 fila
  hasBankInfo: boolean // bank_name Y bank_account
  hasIdentitySubmitted: boolean // external_verifications, identity_kyc del user
}

export interface CompletenessCheck {
  key: keyof VendorCompletenessInputs
  labelKey: string
  done: boolean
}

const CHECK_LABELS: Record<keyof VendorCompletenessInputs, string> = {
  hasLogo: 'completenessLogo',
  hasDescription: 'completenessDescription',
  hasContactChannel: 'completenessContact',
  hasCategories: 'completenessCategories',
  hasBusinessType: 'completenessBusinessType',
  hasServices: 'completenessServices',
  hasBankInfo: 'completenessBankInfo',
  hasIdentitySubmitted: 'completenessIdentity',
}

export function computeStoreCompleteness(inputs: VendorCompletenessInputs): {
  percent: number
  checks: CompletenessCheck[]
} {
  const checks: CompletenessCheck[] = (Object.keys(CHECK_LABELS) as (keyof VendorCompletenessInputs)[]).map(key => ({
    key,
    labelKey: CHECK_LABELS[key],
    done: inputs[key],
  }))

  const doneCount = checks.filter(c => c.done).length
  const percent = Math.round((doneCount / checks.length) * 100)

  return { percent, checks }
}

interface VendorCompletenessSource {
  logo_url: string | null
  description: string | null
  whatsapp: string | null
  instagram: string | null
  bank_name: string | null
  bank_account: string | null
}

export function computeVendorCompleteness(
  vendor: VendorCompletenessSource,
  flags: { hasCategories: boolean; hasBusinessType: boolean; hasServices: boolean; hasIdentitySubmitted: boolean },
) {
  return computeStoreCompleteness({
    hasLogo: !!vendor.logo_url,
    hasDescription: !!(vendor.description && vendor.description.trim()),
    hasContactChannel: !!(vendor.whatsapp || vendor.instagram),
    hasCategories: flags.hasCategories,
    hasBusinessType: flags.hasBusinessType,
    hasServices: flags.hasServices,
    hasBankInfo: !!(vendor.bank_name && vendor.bank_account),
    hasIdentitySubmitted: flags.hasIdentitySubmitted,
  })
}
