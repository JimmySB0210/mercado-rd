// ============================================================
// MercadoRD — Badge de nivel de verificación del vendor
// Ruta: src/components/vendor/VerificationBadge.tsx
// ============================================================
// Server- y Client-safe (sin hooks) — se usa tanto en /tienda/[id]
// (Server Component) como en las tarjetas de /proveedores.
// ============================================================

import { VERIFICATION_BADGES } from '@/lib/vendorLabels'

export function VerificationBadge({ level }: { level: number }) {
  const badge = VERIFICATION_BADGES[Math.min(Math.max(level, 1), 4)]
  if (!badge) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>
  )
}
