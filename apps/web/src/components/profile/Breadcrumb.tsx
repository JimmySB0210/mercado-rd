// ============================================================
// MercadoRD — Ruta de navegación (breadcrumb) de /perfil/*
// Ruta: src/components/profile/Breadcrumb.tsx
// ============================================================
// El último elemento es la página actual: va sin enlace y con
// aria-current="page". Lo usan Configuración y Seguridad de la cuenta.
// ============================================================

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { FOCUS_RING } from './ProfileCard'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
  ariaLabel: string
}

export function Breadcrumb({ items, ariaLabel }: Props) {
  return (
    <nav aria-label={ariaLabel} className="mb-3">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-small">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }} />}
            {item.href ? (
              <Link
                href={item.href}
                className={`font-medium no-underline hover:underline ${FOCUS_RING}`}
                style={{ color: 'var(--color-primary)', borderRadius: 'var(--radius-control)' }}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
