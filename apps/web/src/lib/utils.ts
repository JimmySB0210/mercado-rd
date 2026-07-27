// ============================================================
// MercadoRD — Utilidades generales
// Archivo: lib/utils.ts
// ============================================================

export function getMembershipDuration(createdAt: string): string {
  const created = new Date(createdAt)
  const now = new Date()
  const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth())

  if (months < 1) return 'nuevo'
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}
