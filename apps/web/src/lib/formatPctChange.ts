// ============================================================
// MercadoRD — Formato del cambio porcentual vs. período anterior
// Ruta: src/lib/formatPctChange.ts
// ============================================================
// El signo explícito (+ o −) es lo que se lee sin ambigüedad. La flecha
// y el color solo lo repiten. Un cambio de 0.0% es neutro: sin flecha
// de subida ni de bajada, y en gris.
// ============================================================

export type PctDirection = 'up' | 'down' | 'flat'

export interface PctChangeView {
  text: string
  direction: PctDirection
}

export function formatPctChange(delta: number): PctChangeView {
  const rounded = Math.round(delta * 10) / 10
  if (rounded === 0) return { text: '0.0%', direction: 'flat' }
  const sign = rounded > 0 ? '+' : '−'
  return {
    text: `${sign}${Math.abs(rounded).toFixed(1)}%`,
    direction: rounded > 0 ? 'up' : 'down',
  }
}
