// ============================================================
// MercadoRD — Cálculo de "calidad de publicación" de un producto
// Ruta: src/lib/productQuality.ts
// ============================================================
// Fórmula simple, calculada en el frontend (sin función de Postgres):
//   puntos_obtenidos = requeridos_llenos + recomendados_llenos*0.5
//                       + (tiene_foto ? 1 : 0) + (tiene_descripción ? 1 : 0)
//   puntos_totales   = total_requeridos + total_recomendados*0.5 + 1 + 1
//   porcentaje       = puntos_obtenidos / puntos_totales * 100
// Si la categoría no tiene atributos definidos, total_requeridos y
// total_recomendados son 0 — el cálculo simplemente se basa en foto +
// descripción. Se usa tanto en la lista (app/dashboard/productos) como
// en vivo dentro de ProductForm mientras el vendor llena el formulario.
// ============================================================

export interface QualityInput {
  totalRequired: number
  filledRequired: number
  totalRecommended: number
  filledRecommended: number
  hasPhoto: boolean
  hasDescription: boolean
}

export function computePublishQuality({
  totalRequired, filledRequired, totalRecommended, filledRecommended, hasPhoto, hasDescription,
}: QualityInput): number {
  const earnedPoints = filledRequired + filledRecommended * 0.5 + (hasPhoto ? 1 : 0) + (hasDescription ? 1 : 0)
  const totalPoints = totalRequired + totalRecommended * 0.5 + 1 + 1
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
