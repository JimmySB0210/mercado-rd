// ============================================================
// MercadoRD — Tarjeta de sección del perfil
// Ruta: src/components/profile/ProfileCard.tsx
// ============================================================
// Contenedor común de /perfil: título con icono y, opcionalmente, un
// enlace de acción a la derecha (ej. "Editar" → /perfil/seguridad).
// ============================================================

import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2'

interface Props {
  title: string
  icon: LucideIcon
  action?: { label: string; href: string }
  children: React.ReactNode
}

export function ProfileCard({ title, icon: Icon, action, children }: Props) {
  return (
    <section
      className="p-5"
      style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="flex items-center gap-2 text-h4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          <Icon size={20} aria-hidden style={{ color: 'var(--color-primary)' }} />
          {title}
        </h2>
        {action && (
          <a
            href={action.href}
            className={`inline-flex items-center gap-0.5 min-h-[44px] px-2 -mr-2 text-ui font-semibold no-underline hover:underline ${FOCUS_RING}`}
            style={{ color: 'var(--color-primary)', borderRadius: 'var(--radius-control)' }}
          >
            {action.label}
            <ChevronRight size={16} aria-hidden />
          </a>
        )}
      </div>
      {children}
    </section>
  )
}
