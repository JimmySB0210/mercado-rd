'use client'
// ============================================================
// MercadoRD — Fila desplegable de "Información de acceso"
// Ruta: src/components/profile/AccessRow.tsx
// ============================================================
// Icono + título + descripción y un botón "Actualizar" que despliega
// el formulario de la fila (children). La página decide qué fila está
// abierta (solo una a la vez) y a dónde va el foco.
// ============================================================

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FOCUS_RING } from './ProfileCard'

interface Props {
  id: string
  icon: LucideIcon
  title: string
  text: string
  buttonLabel: string
  cancelLabel: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

export const AccessRow = forwardRef<HTMLButtonElement, Props>(function AccessRow(
  { id, icon: Icon, title, text, buttonLabel, cancelLabel, open, onToggle, children },
  buttonRef,
) {
  const titleId = `${id}-titulo`
  const panelId = `${id}-panel`
  return (
    <div className="p-4" style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-control)', background: 'var(--color-card-bg)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className="flex items-center justify-center flex-shrink-0 w-11 h-11"
            style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
            aria-hidden="true"
          >
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <h3 id={titleId} className="text-ui font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
            <p className="text-small mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
          </div>
        </div>
        <button
          ref={buttonRef}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          className={`inline-flex items-center justify-center gap-1.5 w-full sm:w-auto flex-shrink-0 min-h-[44px] px-4 text-ui font-semibold cursor-pointer transition-colors hover:bg-[color:var(--color-primary-subtle)] ${FOCUS_RING}`}
          style={{ color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-control)' }}
        >
          {open ? cancelLabel : buttonLabel}
          <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div id={panelId} role="region" aria-labelledby={titleId} className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-divider)' }}>
          {children}
        </div>
      )}
    </div>
  )
})
