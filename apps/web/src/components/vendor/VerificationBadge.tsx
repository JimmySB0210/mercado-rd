'use client'
// ============================================================
// MercadoRD — Badge de nivel de verificación del vendor
// Ruta: src/components/vendor/VerificationBadge.tsx
// ============================================================
// Client Component (usa useTranslation) — Next.js permite renderizarlo
// igual desde Server Components (/tienda/[id]) que desde Client
// Components (tarjetas de /proveedores), así que sigue funcionando en
// ambos contextos sin cambios en quien lo usa.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { VERIFICATION_BADGES } from '@/lib/vendorLabels'

export function VerificationBadge({ level }: { level: number }) {
  const { t } = useTranslation('vendorOptions')
  const clamped = Math.min(Math.max(level, 1), 4)
  const badge = VERIFICATION_BADGES[clamped]
  if (!badge) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
      {badge.emoji} {t(`verificationLevel.${clamped}` as Parameters<typeof t>[0])}
    </span>
  )
}
