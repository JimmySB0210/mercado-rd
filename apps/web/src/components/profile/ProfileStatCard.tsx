// ============================================================
// MercadoRD — Tarjeta de contador del perfil
// Ruta: src/components/profile/ProfileStatCard.tsx
// ============================================================
// Toda la tarjeta es un enlace. value: undefined = cargando
// (esqueleto), null = la consulta falló ("—"), número = valor (el 0 se
// muestra como "0").
// ============================================================

import type { LucideIcon } from 'lucide-react'
import { FOCUS_RING } from './ProfileCard'

interface Props {
  label: string
  value: number | null | undefined
  href: string
  icon: LucideIcon
}

export function ProfileStatCard({ label, value, href, icon: Icon }: Props) {
  const shown = value === undefined ? null : value === null ? '—' : String(value)
  return (
    <a
      href={href}
      aria-label={shown === null ? label : `${label}: ${shown}`}
      aria-busy={value === undefined}
      className={`flex items-center gap-3 p-4 min-h-[88px] no-underline transition-shadow hover:[box-shadow:var(--shadow-card-hover)] hover:[border-color:var(--color-border)] ${FOCUS_RING}`}
      style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <span
        className="flex items-center justify-center flex-shrink-0 w-11 h-11"
        style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
        aria-hidden
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-small font-medium leading-tight break-words" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        {shown === null ? (
          <span className="block mt-1 h-7 w-10 animate-pulse" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-control)' }} />
        ) : (
          <span className="block text-metric font-bold" style={{ color: 'var(--color-text-primary)' }}>{shown}</span>
        )}
      </span>
    </a>
  )
}
