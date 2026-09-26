// ============================================================
// MercadoRD — Cálculo de "calidad de publicación" de un producto
// Ruta: src/lib/productQuality.ts
// ============================================================
// Fórmula simple, calculada en el frontend (sin función de Postgres):
//   puntos_obtenidos = requeridos_llenos + recomendados_llenos*0.5
//                       + suma de checks fijos completados
//   puntos_totales   = total_requeridos + total_recomendados*0.5
//                       + cantidad de checks fijos
// Si la categoría no tiene atributos definidos, total_requeridos y
// total_recomendados son 0 — el cálculo se basa solo en los checks
// fijos. Se usa tanto en la lista (app/dashboard/productos) como en
// vivo dentro de ProductForm mientras el vendor llena el formulario.
//
// Checks fijos (nombre/categoría/precio/inventario) son campos que ya
// son obligatorios para GUARDAR cualquier producto (ver handleSubmit
// en ProductForm.tsx) — para un producto ya guardado en la lista
// siempre valen su punto completo; su valor real es en el formulario
// EN VIVO, mientras el vendor todavía los está llenando, mostrando el
// progreso real en vez de saltar de 0% a "completo" recién al guardar.
// ============================================================

export interface QualityInput {
  totalRequired: number
  filledRequired: number
  totalRecommended: number
  filledRecommended: number
  hasPhoto: boolean
  hasDescription: boolean
  hasName: boolean
  hasCategory: boolean
  hasPrice: boolean
  hasStock: boolean
}

export function computePublishQuality({
  totalRequired, filledRequired, totalRecommended, filledRecommended,
  hasPhoto, hasDescription, hasName, hasCategory, hasPrice, hasStock,
}: QualityInput): number {
  const fixedChecks = [hasPhoto, hasDescription, hasName, hasCategory, hasPrice, hasStock]
  const earnedPoints = filledRequired + filledRecommended * 0.5 + fixedChecks.filter(Boolean).length
  const totalPoints = totalRequired + totalRecommended * 0.5 + fixedChecks.length
  if (totalPoints <= 0) return 100
  return Math.round((earnedPoints / totalPoints) * 100)
}

export type QualityTier = 'low' | 'medium' | 'high'

export function qualityTier(percent: number): QualityTier {
  if (percent < 40) return 'low'
  if (percent < 80) return 'medium'
  return 'high'
}

export const QUALITY_TIER_EMOJI: Record<QualityTier, string> = {
  low: '🔴',
  medium: '🟠',
  high: '🟢',
}

export const QUALITY_TIER_COLOR: Record<QualityTier, { bg: string; text: string }> = {
  low: { bg: '#FEE2E2', text: '#991B1B' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high: { bg: '#DCFCE7', text: '#166534' },
}
